/** Human-friendly case reference: MNY-0001, MNY-0002, … per trader. */
export const caseReference = (n: number) => `MNY-${String(n).padStart(4, "0")}`;
