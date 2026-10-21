import { useEffect, useState } from 'react';

/** Live days/hours/minutes/seconds until `target` (a Date). Updates every second. */
export default function useCountdown(target) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [target]);

  if (!target) return null;
  const diff = Math.max(0, target.getTime() - now);
  return {
    done: diff === 0,
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}
