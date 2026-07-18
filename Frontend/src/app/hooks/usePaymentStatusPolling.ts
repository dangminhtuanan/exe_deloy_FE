import { useCallback, useEffect, useState } from "react";

interface PaymentStatusPollingOptions<T> {
  enabled: boolean;
  load: () => Promise<T>;
  isTerminal: (value: T) => boolean;
  intervalMs?: number;
  timeoutMs?: number;
}

export function usePaymentStatusPolling<T>({
  enabled,
  load,
  isTerminal,
  intervalMs = 2000,
  timeoutMs = 60000,
}: PaymentStatusPollingOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [isChecking, setIsChecking] = useState(enabled);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [runId, setRunId] = useState(0);

  const refresh = useCallback(() => {
    setRunId((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsChecking(false);
      return;
    }

    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const startedAt = Date.now();

    setError(null);
    setHasTimedOut(false);
    setIsChecking(true);

    const poll = async () => {
      try {
        const result = await load();
        if (disposed) return;

        setData(result);
        setError(null);

        if (isTerminal(result)) {
          setIsChecking(false);
          return;
        }

        if (Date.now() - startedAt >= timeoutMs) {
          setHasTimedOut(true);
          setIsChecking(false);
          return;
        }

        timer = setTimeout(() => {
          void poll();
        }, intervalMs);
      } catch (pollError) {
        if (!disposed) {
          setError(pollError);
          setIsChecking(false);
        }
      }
    };

    void poll();

    return () => {
      disposed = true;
      if (timer) clearTimeout(timer);
    };
  }, [enabled, intervalMs, isTerminal, load, runId, timeoutMs]);

  return {
    data,
    error,
    hasTimedOut,
    isChecking,
    refresh,
  };
}
