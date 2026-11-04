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
  let badgeClass = 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30';
  let cardBorderClass = 'border-emerald-500/40';
  let dotColor = 'bg-emerald-400';

  if (minutes >= 20) {
    delayStatus = 'DELAYED';
    label = 'DELAYED (20m+)';
    badgeClass = 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-black animate-pulse';
    cardBorderClass = 'border-rose-500 ring-2 ring-rose-500/30';
    dotColor = 'bg-rose-400';
  } else if (minutes >= 10) {
    delayStatus = 'WARNING';
    label = 'Warning (10-20m)';
    badgeClass = 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold';
    cardBorderClass = 'border-amber-500/40';
    dotColor = 'bg-amber-400';
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
