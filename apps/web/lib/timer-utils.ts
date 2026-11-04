export type DelayStatus = 'NORMAL' | 'WARNING' | 'DELAYED';

export interface PrepTimeInfo {
  elapsedSeconds: number;
  minutes: number;
  seconds: number;
  formattedTime: string; // "04:15"
  delayStatus: DelayStatus; // 'NORMAL' | 'WARNING' | 'DELAYED'
  label: string; // "On Time", "Attention", "DELAYED"
  badgeClass: string; // Tailwind color classes for badges
  cardBorderClass: string; // Tailwind border styling
  dotColor: string; // Indicator dot color
}

/**
 * Calculates preparation delay and returns color codes:
 * 🟢 GREEN (< 10 minutes): Normal / On Time
 * 🟡 YELLOW (10 to 19 minutes): Warning / Attention needed
 * 🔴 RED (>= 20 minutes): Delayed / Overdue urgency!
 */
export function calculatePrepTime(createdAt: string | Date): PrepTimeInfo {
  const start = new Date(createdAt).getTime();
  const now = Date.now();
  const elapsedMs = Math.max(0, now - start);
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  const formattedTime = `${mm}:${ss}`;

  let delayStatus: DelayStatus = 'NORMAL';
  let label = 'On Time (<10m)';
  let badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  let cardBorderClass = 'border-emerald-400';
  let dotColor = 'bg-emerald-500';

  if (minutes >= 20) {
    delayStatus = 'DELAYED';
    label = 'DELAYED (20m+)';
    badgeClass = 'bg-rose-100 text-rose-800 border-rose-400 font-black animate-pulse';
    cardBorderClass = 'border-rose-500 ring-2 ring-rose-200';
    dotColor = 'bg-rose-500';
  } else if (minutes >= 10) {
    delayStatus = 'WARNING';
    label = 'Warning (10-20m)';
    badgeClass = 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
    cardBorderClass = 'border-amber-400';
    dotColor = 'bg-amber-500';
  }

  return {
    elapsedSeconds,
    minutes,
    seconds,
    formattedTime,
    delayStatus,
    label,
    badgeClass,
    cardBorderClass,
    dotColor,
  };
}
