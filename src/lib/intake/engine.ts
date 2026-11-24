import { move } from "@/lib/cases/state";
import type { CaseRecord, CaseStore, Message, NewMessage } from "@/lib/cases/types";
import { allNumbers, numbersIn } from "@/lib/text/numbers";

import type { ExtractResult } from "./extract";
import type { FieldKey } from "./fields";
import { markUnknown, mergeExtraction } from "./merge";
import { missingRequired, nextField } from "./progress";

export interface EngineDeps {
  extract: (english: string, asked: FieldKey | null) => Promise<ExtractResult>;
  /** Luganda → English. Only called for Luganda cases. */
  toEnglish: (text: string) => Promise<string>;
}

export type TraderInput =
  | { kind: "message"; text: string; inputType: "text" | "voice" }
  | { kind: "skip"; field: FieldKey };

export class TranslationError extends Error {
  constructor() {
    super("Translation to English failed");
    this.name = "TranslationError";
  }
}

/** The field MANYA last asked about, if the trader is answering a question. */
export function askedField(messages: Message[]): FieldKey | null {
  const last = [...messages].reverse().find((m) => m.sender === "manya");
  return last?.field ?? null;
}

/**
 * One turn of the guided intake (PRD 4.3). The model reads the message; this
 * code decides what is kept, which question comes next, and when the case
 * moves to confirmation.
 */
export async function intakeTurn(
  store: CaseStore,
  record: CaseRecord,
  input: TraderInput,
  deps: EngineDeps,
): Promise<{ case: CaseRecord; added: Message[] }> {
  const history = await store.listMessages(record.id);
  const asked = askedField(history);
  const added: Message[] = [];
  const say = async (m: Omit<NewMessage, "caseId" | "language">) => {
    added.push(await store.addMessage({ ...m, caseId: record.id, language: record.language }));
  };

  let intake = record.intake;
  let category = record.category;
  let retry = false;

  if (input.kind === "skip") {
    intake = markUnknown(intake, input.field);
    await say({
      sender: "trader",
      originalText: "intake.skipped",
      processedText: null,
      inputType: "system",
      field: input.field,
    });
  } else {
    const original = input.text.trim();
    let english = original;
    if (record.language === "lug") {
      english = await deps.toEnglish(original).catch(() => {
        throw new TranslationError();
      });
      // Numbers the trader wrote in digits must survive. Numbers spoken as words
      // may come back as digits; the trader confirms them on the review screen.
      const kept = new Set(allNumbers(english));
      if (!english || !numbersIn(original).every((n) => kept.has(n))) throw new TranslationError();
    }
    await say({
      sender: "trader",
      originalText: original,
      processedText: record.language === "lug" ? english : null,
      inputType: input.inputType,
      field: null,
    });

    const extracted = await deps.extract(english, asked);
    // Values must be grounded in the trader's own words, in either language.
    const merged = mergeExtraction(intake, extracted.extraction, `${original}\n${english}`);
    intake = merged.intake;
    retry = asked !== null && merged.dropped.includes(asked);

    const firstMessage = !intake.narrative;
    if (firstMessage) {
      intake = {
        ...intake,
        narrative: original,
        narrativeEnglish: record.language === "lug" ? english : null,
      };
    }
    if (!category && extracted.category) {
      category = extracted.category;
      await say({
        sender: "manya",
        originalText: category === "other" ? "intake.otherCategory" : "intake.understood",
        processedText: null,
        inputType: "system",
        field: null,
      });
    }
  }

  let status = record.status === "draft" ? move("draft", "collecting_information") : record.status;
  if (status === "paused") status = move("paused", "collecting_information");

  const next = nextField(intake);
  if (retry) {
    await say({
      sender: "manya",
      originalText: "intake.retry",
      processedText: null,
      inputType: "system",
      field: null,
    });
  }
  if (next && status === "collecting_information") {
    await say({
      sender: "manya",
      originalText: `q.${next}`,
      processedText: null,
      inputType: "system",
      field: next,
    });
  } else if (!next && missingRequired(intake).length === 0 && status === "collecting_information") {
    status = move(status, "awaiting_user_confirmation");
    await say({
      sender: "manya",
      originalText: "intake.done",
      processedText: null,
      inputType: "system",
      field: null,
    });
  }

  const updated = await store.updateCase(record.id, { intake, category, status });
  return { case: updated, added };
}
