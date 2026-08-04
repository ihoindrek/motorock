"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

export type TextRevealFaqItem = {
  id: string;
  question: string;
  answer: string;
};

type TextRevealFaqsProps = {
  title: string;
  description: string;
  items: readonly TextRevealFaqItem[];
  supportPrefix: string;
  supportLinkLabel: string;
  supportHref: string;
  variant?: "inline" | "section";
};

export function BlurredStagger({ text }: { text: string }) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <p className="text-sm leading-relaxed break-words whitespace-normal text-ink/75 sm:text-base">
        {text}
      </p>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.015,
      },
    },
  };

  const letterAnimation = {
    hidden: {
      opacity: 0,
      filter: "blur(10px)",
    },
    show: {
      opacity: 1,
      filter: "blur(0px)",
    },
  };

  return (
    <div className="w-full">
      <motion.p
        variants={container}
        initial="hidden"
        animate="show"
        className="text-sm leading-relaxed break-words whitespace-normal text-ink/75 sm:text-base"
      >
        {text.split("").map((char, index) => (
          <motion.span
            key={`${char}-${index}`}
            variants={letterAnimation}
            transition={{ duration: 0.3 }}
            className="inline-block"
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
      </motion.p>
    </div>
  );
}

function FaqSupportText({
  prefix,
  linkLabel,
  href,
  className,
}: {
  prefix: string;
  linkLabel: string;
  href: string;
  className?: string;
}) {
  return (
    <p className={cn("text-sm leading-relaxed text-ink/60", className)}>
      {prefix}{" "}
      <Link href={href} className="font-medium text-accent hover:underline">
        {linkLabel}
      </Link>
      .
    </p>
  );
}

function FaqAccordion({ items }: { items: readonly TextRevealFaqItem[] }) {
  return (
    <Accordion type="single" collapsible>
      {items.map((item) => (
        <AccordionItem key={item.id} value={item.id}>
          <AccordionTrigger>{item.question}</AccordionTrigger>
          <AccordionContent>
            <BlurredStagger text={item.answer} />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export function TextRevealFaqs({
  title,
  description,
  items,
  supportPrefix,
  supportLinkLabel,
  supportHref,
  variant = "section",
}: TextRevealFaqsProps) {
  if (items.length === 0) {
    return null;
  }

  if (variant === "inline") {
    return (
      <div className="border-t border-ink/10 pt-6">
        <h2 className="font-body text-[11px] font-bold uppercase tracking-aggressive text-ink">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-balance text-ink/60">
          {description}
        </p>
        <div className="mt-5">
          <FaqAccordion items={items} />
        </div>
        <FaqSupportText
          prefix={supportPrefix}
          linkLabel={supportLinkLabel}
          href={supportHref}
          className="mt-5"
        />
      </div>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-5 md:gap-12">
      <div className="md:col-span-2">
        <h2 className="font-display text-3xl font-extrabold uppercase leading-tight tracking-tight text-ink sm:text-4xl">
          {title}
        </h2>
        <p className="mt-4 text-balance text-base leading-relaxed text-ink/60 sm:text-lg">
          {description}
        </p>
        <FaqSupportText
          prefix={supportPrefix}
          linkLabel={supportLinkLabel}
          href={supportHref}
          className="mt-6 hidden md:block"
        />
      </div>

      <div className="md:col-span-3">
        <FaqAccordion items={items} />
      </div>

      <FaqSupportText
        prefix={supportPrefix}
        linkLabel={supportLinkLabel}
        href={supportHref}
        className="md:hidden"
      />
    </div>
  );
}
