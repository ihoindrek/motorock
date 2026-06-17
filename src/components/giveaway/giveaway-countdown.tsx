"use client";

import { useEffect, useState } from "react";

type GiveawayCountdownProps = {
  targetDate: string;
  className?: string;
};

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function getTimeLeft(targetDate: string): TimeLeft {
  const diff = Math.max(0, new Date(targetDate).getTime() - Date.now());

  const totalSeconds = Math.floor(diff / 1000);

  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
  };
}

const segments: { key: keyof TimeLeft; label: string; pad: boolean }[] = [
  { key: "days", label: "Days", pad: false },
  { key: "hours", label: "Hours", pad: true },
  { key: "minutes", label: "Minutes", pad: true },
  { key: "seconds", label: "Seconds", pad: true },
];

export function GiveawayCountdown({
  targetDate,
  className = "",
}: GiveawayCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    const update = () => setTimeLeft(getTimeLeft(targetDate));
    update();

    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [targetDate]);

  if (!timeLeft) {
    return (
      <div
        className={`mt-6 h-16 animate-pulse rounded-sm bg-paper/10 ${className}`}
        aria-hidden="true"
      />
    );
  }

  const ended =
    timeLeft.days === 0 &&
    timeLeft.hours === 0 &&
    timeLeft.minutes === 0 &&
    timeLeft.seconds === 0;

  return (
    <div className={className}>
      <p className="font-display text-[10px] font-bold uppercase tracking-aggressive text-paper/45">
        {ended ? "Draw closed" : "Time left to enter"}
      </p>
      <div
        className="mt-3 flex flex-wrap gap-x-5 gap-y-3 sm:gap-x-7"
        role="timer"
        aria-live="polite"
        aria-label={
          ended
            ? "Giveaway draw has ended"
            : `${timeLeft.days} days, ${timeLeft.hours} hours, ${timeLeft.minutes} minutes, ${timeLeft.seconds} seconds remaining`
        }
      >
        {segments.map(({ key, label, pad }) => (
          <div key={key} className="min-w-[3.25rem]">
            <span className="font-display text-[clamp(1.75rem,5vw,2.75rem)] font-extrabold leading-none tabular-nums text-accent">
              {pad ? String(timeLeft[key]).padStart(2, "0") : timeLeft[key]}
            </span>
            <span className="mt-1.5 block font-display text-[10px] font-bold uppercase tracking-aggressive text-paper/50">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
