"use client";

import { useEffect, useMemo, useState } from "react";
import { useDictionary } from "@/context/locale-context";
import { interpolateCampaignMessage } from "@/lib/campaigns/copy";

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

export function GiveawayCountdown({
  targetDate,
  className = "",
}: GiveawayCountdownProps) {
  const dict = useDictionary();
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  const segments = useMemo(
    () =>
      [
        { key: "days" as const, label: dict.giveaway.days, pad: false },
        { key: "hours" as const, label: dict.giveaway.hours, pad: true },
        { key: "minutes" as const, label: dict.giveaway.minutes, pad: true },
        { key: "seconds" as const, label: dict.giveaway.seconds, pad: true },
      ] as const,
    [dict.giveaway],
  );

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

  const ariaLabel = ended
    ? dict.giveaway.drawEndedAria
    : interpolateCampaignMessage(dict.giveaway.timeRemainingAria, {
        days: String(timeLeft.days),
        hours: String(timeLeft.hours),
        minutes: String(timeLeft.minutes),
        seconds: String(timeLeft.seconds),
      });

  return (
    <div className={className}>
      <p className="font-body text-[10px] font-bold uppercase tracking-aggressive text-paper/45">
        {ended ? dict.giveaway.drawClosed : dict.giveaway.timeLeft}
      </p>
      <div
        className="mt-3 flex flex-wrap gap-x-5 gap-y-3 sm:gap-x-7"
        role="timer"
        aria-live="polite"
        aria-label={ariaLabel}
      >
        {segments.map(({ key, label, pad }) => (
          <div key={key} className="min-w-[3.25rem]">
            <span className="font-body text-[clamp(1.75rem,5vw,2.75rem)] font-extrabold leading-none tabular-nums text-accent">
              {pad ? String(timeLeft[key]).padStart(2, "0") : timeLeft[key]}
            </span>
            <span className="mt-1.5 block font-body text-[10px] font-bold uppercase tracking-aggressive text-paper/50">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
