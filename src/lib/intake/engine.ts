import { move } from "@/lib/cases/state";
import type { CaseRecord, CaseStore, Message, NewMessage } from "@/lib/cases/types";
import { allNumbers, numbersIn } from "@/lib/text/numbers";

import type { ExtractResult } from "./extract";
import { type FieldKey, type Intake, type Stage, fieldSpec } from "./fields";
import { markUnknown, mergeEvents, mergeExtraction } from "./merge";
import {
  completion,
  countRound,
  decodeFields,
  encodeFields,
  markAsked,
  nextStep,
} from "./progress";

/** What the model is told about the turn: the plan position, what is known and what is missing. */
export interface ExtractContext {
  stage: Stage | null;
  /** The question MANYA asked, as English text, or null for the opening account. */
  question: string | null;
  asking: FieldKey[];
  known: Partial<Record<FieldKey, string | number>>;
}

export interface EngineDeps {
  extract: (english: string, context: ExtractContext) => Promise<ExtractResult>;
  /** Luganda → English. Only called for Luganda cases. */
  toEnglish: (text: string) => Promise<string>;
  /** English text of a question key, for the model's context. */
  questionText?: (key: string) => string;
}

export type TraderInput =
  | { kind: "message"; text: string; inputType: "text" | "voice" }
  | { kind: "skip" };

export class TranslationError extends Error {
  constructor() {
    super("Translation to English failed");
    this.name = "TranslationError";
  }
}

/** MANYA's last question in the conversation, if the trader is answering one. */
export function lastQuestion(messages: Message[]): Message | null {
  return [...messages].reverse().find((m) => m.sender === "manya" && m.field) ?? null;
}

/** The fields MANYA last asked about. */
export function askedFields(messages: Message[]): FieldKey[] {
  return decodeFields(lastQuestion(messages)?.field ?? null);
}

const knownValues = (intake: Intake) =>
  Object.fromEntries(
    Object.entries(intake.values).map(([k, v]) => [k, v.value]),
  ) as ExtractContext["known"];

/**
 * One turn of the six-stage guided intake. The model reads the message; this
 * code decides what is kept, which stage comes next, what is asked, and when
 * the case moves to review. MANYA's lines are stored as keys (and the fields
 * they cover), so they show in whichever language the trader picks.
 */
export async function intakeTurn(
  store: CaseStore,
  record: CaseRecord,
  input: TraderInput,
  deps: EngineDeps,
): Promise<{ case: CaseRecord; added: Message[] }> {
  const history = await store.listMessages(record.id);
  const question = lastQuestion(history);
  const asking = askedFields(history);
  const added: Message[] = [];
  const say = async (m: Omit<NewMessage, "caseId" | "language">) => {
    added.push(await store.addMessage({ ...m, caseId: record.id, language: record.language }));
  };

  let intake = record.intake;
  let category = record.category;
  let retry = false;

  if (input.kind === "skip") {
    // "I don't know" covers every detail the last question asked for that is still missing.
    for (const key of asking) if (!intake.values[key]) intake = markUnknown(intake, key);
    await say({
      sender: "trader",
      originalText: "intake.skipped",
      processedText: null,
      inputType: "system",
      field: encodeFields(asking),
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

    const extracted = await deps.extract(english, {
      stage: asking[0] ? fieldSpec(asking[0]).stage : null,
      question: question ? (deps.questionText?.(question.originalText) ?? null) : null,
      asking,
      known: knownValues(intake),
    });
    // Values must be grounded in the trader's own words, in either language.
    const grounding = `${original}\n${english}`;
    const merged = mergeExtraction(intake, extracted.extraction, grounding);
    intake = mergeEvents(countRound(merged.intake), extracted.events ?? [], grounding);
    retry = asking.length > 0 && asking.some((k) => merged.dropped.includes(k));

    if (!intake.narrative) {
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

  if (status === "collecting_information") {
    if (retry) {
      await say({
        sender: "manya",
        originalText: "intake.retry",
        processedText: null,
        inputType: "system",
        field: null,
      });
    }
    const step = nextStep(intake);
    if (step) {
      intake = markAsked(intake, step.stage);
      await say({
        sender: "manya",
        originalText: step.question,
        processedText: null,
        inputType: "system",
        field: encodeFields(step.fields),
      });
    } else if (intake.narrative) {
      // Nothing left to ask: review, even with gaps. Missing details are listed, never guessed.
      status = move(status, "awaiting_user_confirmation");
      await say({
        sender: "manya",
        originalText: completion(intake) === 100 ? "intake.done" : "intake.doneMissing",
        processedText: null,
        inputType: "system",
        field: null,
      });
    }
  }

  const updated = await store.updateCase(record.id, { intake, category, status });
  return { case: updated, added };
}
