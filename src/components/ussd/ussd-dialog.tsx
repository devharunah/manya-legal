import { Loader2 } from "lucide-react";
import { useState } from "react";

import type { Expect } from "@/lib/ussd/engine";

const LINK = "rounded-md px-3 py-1.5 text-[15px] font-semibold text-[#7cb8ff] hover:bg-white/10";

/** The "USSD code running…" card shown while the network answers. */
export function UssdRunning() {
  return (
    <Overlay>
      <output className="flex items-center gap-3 rounded-2xl bg-[#2b2b30] px-5 py-4 text-[15px] text-white shadow-xl">
        <Loader2 className="size-5 animate-spin text-[#7cb8ff]" aria-hidden />
        USSD code running…
      </output>
    </Overlay>
  );
}

/**
 * A USSD pop-up, as an Android phone shows it: the network's text, a reply
 * box while the session continues, and Cancel / Send. A final screen has OK.
 */
export function UssdDialog({
  text,
  end,
  expect,
  onSend,
  onClose,
}: {
  text: string;
  end: boolean;
  expect: Expect;
  onSend: (reply: string) => void;
  onClose: () => void;
}) {
  // The parent gives every screen a new key, so the reply box starts empty.
  const [reply, setReply] = useState("");

  return (
    <Overlay>
      <dialog
        open
        aria-label="USSD"
        className="static m-0 w-full rounded-2xl border-0 bg-[#2b2b30] p-4 text-white shadow-2xl"
      >
        <p data-testid="ussd-text" className="text-[15px] leading-snug whitespace-pre-line">
          {text}
        </p>
        {end ? (
          <div className="mt-4 flex justify-end">
            <button type="button" onClick={onClose} className={LINK}>
              OK
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (reply.trim()) onSend(reply);
            }}
          >
            <input
              // biome-ignore lint/a11y/noAutofocus: a USSD reply box takes focus, as on a phone.
              autoFocus
              aria-label="Reply"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") onClose();
              }}
              inputMode={expect === "text" ? "text" : "numeric"}
              autoComplete="off"
              maxLength={60}
              className="mt-4 w-full border-b-2 border-[#7cb8ff] bg-transparent px-1 py-1.5 text-[16px] text-white outline-none focus-visible:shadow-none!"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={onClose} className={LINK}>
                Cancel
              </button>
              <button type="submit" className={LINK}>
                Send
              </button>
            </div>
          </form>
        )}
      </dialog>
    </Overlay>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 px-4">
      {children}
    </div>
  );
}
