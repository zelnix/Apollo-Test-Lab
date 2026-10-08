// Tests for the abort-aware wrapper used by the native DNS lookup. These prove
// that Stop / timeout reject immediately and that a late result arriving AFTER
// abort is discarded (never recorded as Completed).

import { makeAbortError, withAbort } from "@/src/lib/async-abort";

describe("withAbort", () => {
  it("resolves normally when not aborted", async () => {
    const controller = new AbortController();
    await expect(withAbort(controller.signal, Promise.resolve("ok"))).resolves.toBe("ok");
  });

  it("rejects immediately if the signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(withAbort(controller.signal, new Promise(() => {}))).rejects.toMatchObject({
      name: "AbortError",
    });
  });

  it("rejects with AbortError when aborted before the work settles", async () => {
    const controller = new AbortController();
    const pending = new Promise<string>(() => {}); // never resolves
    const wrapped = withAbort(controller.signal, pending);
    controller.abort();
    await expect(wrapped).rejects.toMatchObject({ name: "AbortError" });
  });

  it("discards a late result that arrives after abort (no Completed)", async () => {
    const controller = new AbortController();
    let resolveLate: (v: string) => void = () => {};
    const late = new Promise<string>((res) => {
      resolveLate = res;
    });
    const wrapped = withAbort(controller.signal, late);

    controller.abort();
    // The native call "finishes" late — this must NOT turn into a success.
    resolveLate("late-dns-result");

    await expect(wrapped).rejects.toMatchObject({ name: "AbortError" });
  });

  it("propagates a genuine error from the work", async () => {
    const controller = new AbortController();
    await expect(
      withAbort(controller.signal, Promise.reject(new Error("NXDOMAIN"))),
    ).rejects.toThrow("NXDOMAIN");
  });

  it("makeAbortError is named AbortError", () => {
    expect(makeAbortError().name).toBe("AbortError");
  });
});
