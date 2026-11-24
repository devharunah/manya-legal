import { encodeWav, mixToMono, resample } from "../wav";

describe("encodeWav", () => {
  it("writes a 44-byte PCM header for 16-bit mono", () => {
    const buf = encodeWav(new Float32Array([0, 1, -1]), 16_000);
    const view = new DataView(buf);
    const ascii = (o: number, n: number) =>
      String.fromCharCode(...new Uint8Array(buf.slice(o, o + n)));
    expect(buf.byteLength).toBe(44 + 3 * 2);
    expect(ascii(0, 4)).toBe("RIFF");
    expect(ascii(8, 4)).toBe("WAVE");
    expect(view.getUint16(22, true)).toBe(1); // mono
    expect(view.getUint32(24, true)).toBe(16_000);
    expect(view.getUint16(34, true)).toBe(16);
    expect(view.getInt16(46, true)).toBe(0x7fff);
    expect(view.getInt16(48, true)).toBe(-0x8000);
  });

  it("clips samples outside -1..1 instead of wrapping", () => {
    const view = new DataView(encodeWav(new Float32Array([2, -3]), 8_000));
    expect(view.getInt16(44, true)).toBe(0x7fff);
    expect(view.getInt16(46, true)).toBe(-0x8000);
  });
});

describe("resample", () => {
  it("downsamples 48 kHz to 16 kHz at a third of the length", () => {
    const out = resample(new Float32Array(48_000).fill(0.5), 48_000, 16_000);
    expect(out.length).toBe(16_000);
    expect(out[0]).toBeCloseTo(0.5);
  });

  it("returns the input when the rate already matches", () => {
    const input = new Float32Array([0.1, 0.2]);
    expect(resample(input, 16_000, 16_000)).toBe(input);
  });
});

describe("mixToMono", () => {
  it("averages stereo channels", () => {
    const out = mixToMono([new Float32Array([1, 0]), new Float32Array([0, 1])]);
    expect(Array.from(out)).toEqual([0.5, 0.5]);
  });

  it("handles no channels", () => {
    expect(mixToMono([]).length).toBe(0);
  });
});
