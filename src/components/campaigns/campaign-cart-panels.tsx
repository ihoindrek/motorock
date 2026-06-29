"use client";

import { useCart } from "@/context/cart-context";
import { useDictionary, useLocale } from "@/context/locale-context";
import { CampaignBanner } from "@/components/campaigns/campaign-banner";
import { getCampaignStatuses } from "@/lib/campaigns/evaluate";
import type { CampaignPlacement } from "@/types/campaign";
import { cn } from "@/lib/utils";

type CampaignCartPanelsProps = {
  placement: CampaignPlacement;
  variant?: "compact" | "default";
  className?: string;
};

export function CampaignCartPanels({
  placement,
  variant = "default",
  className,
}: CampaignCartPanelsProps) {
  const { lines, itemCount } = useCart();
  const locale = useLocale();
  const dict = useDictionary();

  if (itemCount === 0) {
    return null;
  }

  const statuses = getCampaignStatuses(lines, placement, locale, dict);

  if (statuses.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        variant === "compact" ? "space-y-3" : "space-y-4",
        className,
      )}
    >
      {statuses.map((status) => (
        <CampaignBanner
          key={status.campaign.id}
          status={status}
          variant={variant}
        />
      ))}
    </div>
  );
}
