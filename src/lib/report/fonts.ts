import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type { Fonts } from "./pdf-writer";

const DIR = join(process.cwd(), "src", "assets", "fonts");
let cached: Promise<Fonts> | undefined;

/** Noto Sans (SIL OFL), shipped with the server bundle via next.config outputFileTracingIncludes. */
export function loadFonts(): Promise<Fonts> {
  cached ??= Promise.all([
    readFile(join(DIR, "NotoSans-Regular.ttf")),
    readFile(join(DIR, "NotoSans-Bold.ttf")),
  ]).then(([regular, bold]) => ({ regular: new Uint8Array(regular), bold: new Uint8Array(bold) }));
  return cached;
}
