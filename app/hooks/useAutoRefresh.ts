import { useEffect, useEffectEvent } from "react";

type AutoRefreshOptions = {
  // null / 0 disables auto refresh
  intervalMs: number | null;
  enabled?: boolean;
};

/**
 * Calls `onRefresh` every `intervalMs`.
 *
 * - Pauses while the tab is hidden
 * - On return to the tab, refreshes immediately
 *   if an interval has elapsed, then resumes
 */
export const useAutoRefresh = (
  onRefresh: () => void,
  { intervalMs, enabled = true }: AutoRefreshOptions
) => {
  const refresh = useEffectEvent(onRefresh);

  useEffect(() => {
    if (!enabled || !intervalMs) return;

    let timer: ReturnType<typeof setInterval> | undefined;
    let lastRun = Date.now();

    const tick = () => {
      lastRun = Date.now();
      refresh();
    };

    const stop = () => {
      if (timer) clearInterval(timer);
      timer = undefined;
    };

    const start = () => {
      stop();
      timer = setInterval(tick, intervalMs);
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        stop();
        return;
      }

      if (Date.now() - lastRun >= intervalMs) {
        tick();
      }

      start();
    };

    if (!document.hidden) start();

    document.addEventListener(
      "visibilitychange",
      onVisibilityChange
    );

    return () => {
      stop();
      document.removeEventListener(
        "visibilitychange",
        onVisibilityChange
      );
    };
  }, [intervalMs, enabled]);
};
