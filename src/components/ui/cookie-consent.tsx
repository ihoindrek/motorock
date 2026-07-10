"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BarChart3,
  ChevronRight,
  CookieIcon,
  Settings2,
  Shield,
  Target,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { cn } from "@/lib/utils";

export interface CookieCategory {
  id: string;
  name: string;
  description: string;
  icon?: React.ReactNode;
  isEssential?: boolean;
}

export interface CookieConsentCopy {
  bannerTitle: string;
  bannerDescription: string;
  acceptAll: string;
  customize: string;
  rejectAll: string;
  savePreferences: string;
  preferencesTitle: string;
  manageDescription: string;
  policyLink: string;
  requiredBadge: string;
  requiredHint: string;
  reopenLabel: string;
}

export interface CookieConsentProps {
  className?: string;
  categories: CookieCategory[];
  cookiePolicyUrl: string;
  copy: CookieConsentCopy;
  isBannerVisible: boolean;
  isCustomizeOpen: boolean;
  isReopenVisible?: boolean;
  preferences: boolean[];
  onPreferencesChange: (preferences: boolean[]) => void;
  onCustomizeOpenChange: (open: boolean) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onSave: () => void;
}

const DEFAULT_CATEGORY_ICONS: Record<string, React.ReactNode> = {
  essential: <Shield className="h-4 w-4 text-stock" />,
  preferences: <Settings2 className="h-4 w-4 text-primary" />,
  analytics: <BarChart3 className="h-4 w-4 text-primary" />,
  marketing: <Target className="h-4 w-4 text-primary" />,
};

function CookieConsent({
  className,
  categories,
  cookiePolicyUrl,
  copy,
  isBannerVisible,
  isCustomizeOpen,
  isReopenVisible = false,
  preferences,
  onPreferencesChange,
  onCustomizeOpenChange,
  onAcceptAll,
  onRejectAll,
  onSave,
}: CookieConsentProps) {
  const handleToggle = React.useCallback(
    (index: number, checked: boolean) => {
      if (categories[index]?.isEssential) {
        return;
      }

      onPreferencesChange(
        preferences.map((value, currentIndex) =>
          currentIndex === index ? checked : value,
        ),
      );
    },
    [categories, onPreferencesChange, preferences],
  );

  return (
    <TooltipProvider delayDuration={150}>
      <CookieBanner
        isVisible={isBannerVisible}
        onAcceptAll={onAcceptAll}
        onCustomize={() => onCustomizeOpenChange(true)}
        cookiePolicyUrl={cookiePolicyUrl}
        copy={copy}
        className={className}
      />

      <CookieCustomizeDialog
        open={isCustomizeOpen}
        onOpenChange={onCustomizeOpenChange}
        categories={categories}
        preferences={preferences}
        onToggle={handleToggle}
        onSave={onSave}
        onRejectAll={onRejectAll}
        copy={copy}
      />

      <AnimatePresence>
        {isReopenVisible ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-4 right-4 z-[65]"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  aria-label={copy.reopenLabel}
                  onClick={() => onCustomizeOpenChange(true)}
                  className="h-11 w-11 rounded-full bg-[#2a2a2a] text-card-foreground shadow-[0_10px_28px_rgb(0_0_0_/_0.35)] hover:bg-muted"
                >
                  <CookieIcon className="h-[1.125rem] w-[1.125rem]" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">{copy.reopenLabel}</TooltipContent>
            </Tooltip>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </TooltipProvider>
  );
}

interface CookieBannerProps {
  isVisible: boolean;
  onAcceptAll: () => void;
  onCustomize: () => void;
  cookiePolicyUrl: string;
  copy: CookieConsentCopy;
  className?: string;
}

function CookieBanner({
  isVisible,
  onAcceptAll,
  onCustomize,
  cookiePolicyUrl,
  copy,
  className,
}: CookieBannerProps) {
  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className={cn(
            "fixed bottom-0 left-0 right-0 z-[70] sm:bottom-4 sm:left-auto sm:right-4 sm:max-w-[26rem]",
            className,
          )}
        >
          <div className="m-3 rounded-xl bg-card/95 text-card-foreground shadow-[0_16px_44px_rgb(0_0_0_/_0.28)] backdrop-blur-lg">
            <div className="flex items-center gap-3 p-5 pb-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <CookieIcon className="h-5 w-5 text-primary" />
              </div>
              <h2 className="font-body text-base font-extrabold leading-tight sm:text-lg">
                {copy.bannerTitle}
              </h2>
            </div>

            <div className="px-5 pb-4">
              <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
                {copy.bannerDescription}
              </p>
              <Link
                href={cookiePolicyUrl}
                className="group inline-flex items-center text-xs font-semibold text-primary transition-colors hover:underline"
              >
                {copy.policyLink}
                <ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="flex flex-col gap-2 border-t border-border/40 bg-muted/20 p-4 sm:flex-row">
              <Button
                onClick={onAcceptAll}
                size="sm"
                className="h-9 w-full rounded-lg text-sm sm:flex-1"
              >
                {copy.acceptAll}
              </Button>
              <Button
                onClick={onCustomize}
                size="sm"
                variant="outline"
                className="h-9 w-full rounded-lg border-border/50 bg-transparent text-card-foreground sm:flex-1"
              >
                {copy.customize}
              </Button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

interface CookieCustomizeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CookieCategory[];
  preferences: boolean[];
  onToggle: (index: number, checked: boolean) => void;
  onSave: () => void;
  onRejectAll: () => void;
  copy: CookieConsentCopy;
}

function CookieCustomizeDialog({
  open,
  onOpenChange,
  categories,
  preferences,
  onToggle,
  onSave,
  onRejectAll,
  copy,
}: CookieCustomizeDialogProps) {
  const titleId = React.useId();
  const panelRef = React.useRef<HTMLDivElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const shouldReduceMotion = useReducedMotion();

  useFocusTrap(panelRef, open, {
    onEscape: () => onOpenChange(false),
    initialFocus: closeRef,
  });

  React.useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const panelMotion = shouldReduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { opacity: 0, y: 28 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 20 },
      };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.25 }}
            className="fixed inset-0 z-[200] cursor-default bg-black/75 backdrop-blur-[3px]"
            onClick={() => onOpenChange(false)}
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            {...panelMotion}
            transition={
              shouldReduceMotion
                ? { duration: 0.01 }
                : { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
            }
            className="fixed inset-x-3 top-[max(0.75rem,env(safe-area-inset-top))] bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[210] flex max-h-none w-auto flex-col overflow-hidden rounded-xl bg-card text-card-foreground shadow-[0_20px_60px_rgb(0_0_0_/_0.38)] sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-h-[min(88dvh,40rem)] sm:w-[calc(100%-2rem)] sm:max-w-[34rem] sm:-translate-x-1/2 sm:-translate-y-1/2"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border/40 px-5 py-4">
              <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
                className="min-w-0 pr-2"
              >
                <h2 id={titleId} className="text-xl font-semibold">
                  {copy.preferencesTitle}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{copy.manageDescription}</p>
              </motion.div>
              <Button
                ref={closeRef}
                type="button"
                size="icon"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-10 w-10 shrink-0 rounded-full border-border/60 bg-card text-card-foreground hover:bg-muted/50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain px-5 py-4">
              {categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.32,
                    delay: shouldReduceMotion ? 0 : 0.1 + index * 0.055,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className={cn(
                    "rounded-xl border p-3.5 transition-colors duration-200",
                    preferences[index]
                      ? "border-primary/30 bg-primary/5 shadow-sm"
                      : "border-border/50 hover:border-border/70",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={cn(
                          "rounded-lg p-2 transition-colors",
                          preferences[index] ? "bg-primary/10" : "bg-muted",
                        )}
                      >
                        {category.icon ?? DEFAULT_CATEGORY_ICONS[category.id] ?? (
                          <CookieIcon className="h-4 w-4" />
                        )}
                      </div>
                      <Label
                        htmlFor={`cookie-${category.id}`}
                        className="cursor-pointer text-base font-semibold"
                      >
                        {category.name}
                        {category.isEssential ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                                {copy.requiredBadge}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">{copy.requiredHint}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : null}
                      </Label>
                    </div>
                    <Switch
                      id={`cookie-${category.id}`}
                      checked={preferences[index] || false}
                      onCheckedChange={(checked) => onToggle(index, checked)}
                      disabled={category.isEssential}
                    />
                  </div>
                  <p className="mt-2 text-sm leading-snug text-muted-foreground">
                    {category.description}
                  </p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: shouldReduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="shrink-0 border-t border-border/40 bg-muted/20 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
            >
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  onClick={onRejectAll}
                  className="min-h-11 w-full border-border/50 bg-transparent text-card-foreground sm:min-w-[120px] sm:w-auto"
                >
                  {copy.rejectAll}
                </Button>
                <Button
                  onClick={onSave}
                  className="min-h-11 w-full sm:min-w-[140px] sm:w-auto"
                >
                  {copy.savePreferences}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

export { CookieConsent };
