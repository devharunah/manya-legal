/**
 * Case workflow (PRD 4.6). The backend decides every transition; the model
 * never moves a case on.
 */
export const CASE_STATUSES = [
  "draft",
  "collecting_information",
  "awaiting_user_confirmation",
  "report_generated",
  "completed",
  "paused",
] as const;

export type CaseStatus = (typeof CASE_STATUSES)[number];

const ALLOWED: Record<CaseStatus, readonly CaseStatus[]> = {
  draft: ["collecting_information", "paused"],
  collecting_information: ["awaiting_user_confirmation", "paused"],
  awaiting_user_confirmation: ["collecting_information", "report_generated", "paused"],
  // Editing a generated report reopens confirmation and produces a new version.
  report_generated: ["awaiting_user_confirmation", "completed", "paused"],
  completed: [],
  paused: ["collecting_information", "awaiting_user_confirmation"],
};

export const canMove = (from: CaseStatus, to: CaseStatus) => ALLOWED[from].includes(to);

export class TransitionError extends Error {
  constructor(from: CaseStatus, to: CaseStatus) {
    super(`A case can't move from ${from} to ${to}.`);
    this.name = "TransitionError";
  }
}

export function move(from: CaseStatus, to: CaseStatus): CaseStatus {
  if (from === to) return to;
  if (!canMove(from, to)) throw new TransitionError(from, to);
  return to;
}
