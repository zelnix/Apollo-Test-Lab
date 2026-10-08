// Small, framework-free abort helpers. Pure so they are unit-testable without a
// React Native / Expo runtime.

export function makeAbortError(): Error {
  const e = new Error("Aborted");
  e.name = "AbortError";
  return e;
}

// Settles with `work`, but rejects with an AbortError the instant `signal`
// aborts (user Stop or the request timeout). Crucially, a result that arrives
// AFTER the signal has aborted is discarded — so a late native DNS resolution
// can never be recorded as a Completed outcome.
export function withAbort<T>(signal: AbortSignal, work: Promise<T>): Promise<T> {
  if (signal.aborted) return Promise.reject(makeAbortError());
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const cleanup = () => {
      try {
        signal.removeEventListener("abort", onAbort);
      } catch {
        // no-op: some runtimes may not support removeEventListener
      }
    };
    const onAbort = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(makeAbortError());
    };
    signal.addEventListener("abort", onAbort);
    work.then(
      (value) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(value);
      },
      (error) => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(error);
      },
    );
  });
}
