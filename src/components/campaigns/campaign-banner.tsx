import Link from "next/link";
import { cn } from "@/lib/utils";
import type { CampaignStatus } from "@/types/campaign";

type CampaignBannerProps = {
  status: CampaignStatus;
  variant?: "compact" | "default";
  className?: string;
};

function EligibleMessage({ message }: { message: string }) {
  const splitIndex = message.indexOf(" — ");

  if (splitIndex === -1) {
    return (
      <span className="font-bold text-ink">{message}</span>
    );
  }

  return (
    <>
      <span className="font-bold text-ink">{message.slice(0, splitIndex)}</span>
      <span className="text-ink/70">{message.slice(splitIndex)}</span>
    </>
  );
}

export function CampaignBanner({
  status,
  variant = "default",
  className,
}: CampaignBannerProps) {
  const { campaign, isEligible, progress, progressMessage, eligibleMessage } =
    status;
  const title = campaign.shortTitle ?? campaign.title;
  const message = isEligible ? eligibleMessage : progressMessage;
  const ctaLabel = campaign.content.ctaLabel ?? "Rules";

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "rounded-sm border border-accent/25 bg-accent/[0.06] px-4 py-3",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="font-display text-[10px] font-bold uppercase tracking-aggressive text-accent">
            {title}
          </p>
          <Link
            href={campaign.content.ctaHref}
            className="shrink-0 font-display text-[10px] font-bold uppercase tracking-aggressive text-ink/45 transition-colors hover:text-accent"
          >
            {ctaLabel}
          </Link>
        </div>
        <p className="mt-2 text-sm leading-snug">
          {isEligible ? (
            <EligibleMessage message={message} />
          ) : (
            <span className="text-ink/75">{message}</span>
          )}
        </p>
        {!isEligible ? (
          <div
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink/10"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Campaign entry progress"
          >
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-300 motion-reduce:transition-none"
              style={{ width: `${progress}%` }}
            />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-sm border border-accent/20 bg-gradient-to-br from-accent/[0.08] to-transparent px-5 py-4 sm:px-6",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-[10px] font-bold uppercase tracking-aggressive text-accent">
            Active campaign
          </p>
          <p className="mt-1 font-display text-base font-extrabold uppercase tracking-tight text-ink sm:text-lg">
            {title}
          </p>
        </div>
        <Link
          href={campaign.content.ctaHref}
          className="font-display text-[10px] font-bold uppercase tracking-aggressive text-ink/45 transition-colors hover:text-accent"
        >
          {ctaLabel} →
        </Link>
      </div>
      <p className="mt-3 text-sm leading-relaxed sm:text-base">
        {isEligible ? (
          <EligibleMessage message={message} />
        ) : (
          <span className="text-ink/70">{message}</span>
        )}
      </p>
      {!isEligible ? (
        <div className="mt-4">
          <div className="mb-2 flex justify-between font-display text-[10px] font-bold uppercase tracking-aggressive text-ink/45">
            <span>Progress</span>
            <span className="tabular-nums">{Math.round(progress)}%</span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-ink/10"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Campaign entry progress"
          >
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-300 motion-reduce:transition-none"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <p className="mt-3 inline-flex items-center gap-2 font-display text-xs font-bold uppercase tracking-aggressive text-accent">
          <span
            className="size-2 rounded-full bg-accent motion-safe:animate-pulse"
            aria-hidden="true"
          />
          1 giveaway entry with this order
        </p>
      )}
    </div>
  );
}
