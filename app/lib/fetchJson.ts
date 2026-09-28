export const FETCH_TIMEOUT_MS = 20_000;

/*
 * fetch + JSON parse that gives up after `timeoutMs`, so a stalled
 * request fails instead of leaving the page waiting forever.
 *
 * Aborting `init.signal` still rejects with an AbortError;
 * running out of time rejects with a TimeoutError.
 */
export const fetchJson = async <T = unknown>(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = FETCH_TIMEOUT_MS,
): Promise<{ response: Response; data: T }> => {
  const controller = new AbortController();
  const outerSignal = init.signal;

  const onOuterAbort = () => controller.abort(outerSignal?.reason);

  if (outerSignal?.aborted) {
    onOuterAbort();
  } else {
    outerSignal?.addEventListener("abort", onOuterAbort, { once: true });
  }

  let timedOut = false;

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });

    // Body is read inside the timeout too: it can stall as well
    const data = (await response.json()) as T;

    return { response, data };
  } catch (error) {
    if (timedOut) {
      throw new DOMException("Request timed out", "TimeoutError");
    }

    throw error;
  } finally {
    clearTimeout(timer);
    outerSignal?.removeEventListener("abort", onOuterAbort);
  }
};
