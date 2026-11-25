import { Delete, Phone } from "lucide-react";

const KEYS = [
  ["1", ""],
  ["2", "ABC"],
  ["3", "DEF"],
  ["4", "GHI"],
  ["5", "JKL"],
  ["6", "MNO"],
  ["7", "PQRS"],
  ["8", "TUV"],
  ["9", "WXYZ"],
  ["*", ""],
  ["0", "+"],
  ["#", ""],
] as const;

/** The phone's dial pad: twelve keys, call and delete. */
export function Keypad({
  onKey,
  onCall,
  onDelete,
}: {
  onKey: (key: string) => void;
  onCall: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="px-6 pb-6">
      <div className="grid grid-cols-3 gap-x-5 gap-y-3">
        {KEYS.map(([key, letters]) => (
          <button
            key={key}
            type="button"
            aria-label={key}
            onClick={() => onKey(key)}
            className="mx-auto flex size-[64px] flex-col items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 active:bg-white/30"
          >
            <span className="text-[26px] leading-none font-light">{key}</span>
            <span className="mt-0.5 h-3 text-[9px] font-semibold tracking-[0.15em] text-white/60">
              {letters}
            </span>
          </button>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 items-center gap-x-5">
        <span />
        <button
          type="button"
          aria-label="Call"
          onClick={onCall}
          className="mx-auto grid size-[64px] place-items-center rounded-full bg-[#22c55e] text-white transition hover:bg-[#16a34a]"
        >
          <Phone className="size-7 fill-current" aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Delete"
          onClick={onDelete}
          className="mx-auto grid size-12 place-items-center rounded-full text-white/80 transition hover:bg-white/10"
        >
          <Delete className="size-6" aria-hidden />
        </button>
      </div>
    </div>
  );
}
