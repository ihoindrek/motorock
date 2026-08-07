"use client";

import Image from "next/image";
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
  image?: {
    src: string;
    alt: string;
  };
};

const answerTextClassName =
  "text-sm leading-relaxed text-pretty text-ink/75 sm:text-base";

function splitAnswerTokens(text: string) {
  return text.match(/\S+|\s+/g) ?? [text];
}

export function BlurredStagger({ text }: { text: string }) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <p className={answerTextClassName}>{text}</p>;
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

  const tokenAnimation = {
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
    <div className="w-full min-w-0">
      <motion.p
        variants={container}
        initial="hidden"
        animate="show"
        className={answerTextClassName}
      >
        {splitAnswerTokens(text).map((token, index) => {
          if (/^\s+$/.test(token)) {
            return token;
          }

          return (
            <motion.span
              key={`${token}-${index}`}
              variants={tokenAnimation}
              transition={{ duration: 0.3 }}
              className="inline-block whitespace-nowrap"
            >
              {token}
            </motion.span>
          );
        })}
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

function FaqProductImage({
  image,
  className,
}: {
  image: { src: string; alt: string };
  className?: string;
}) {
  return (
    <figure className={cn("overflow-hidden", className)}>
      <div className="relative aspect-[4/3]">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="(min-width: 1024px) 28rem, (min-width: 768px) 40vw"
          className="object-contain p-5"
        />
      </div>
    </figure>
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
  image,
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
        <h2 className="font-body text-3xl font-bold normal-case leading-tight tracking-normal text-ink sm:text-4xl">
          {title}
        </h2>
        <p className="mt-4 text-balance text-base leading-relaxed text-ink/60 sm:text-lg">
          {description}
        </p>
        {image ? (
          <FaqProductImage image={image} className="mt-8 hidden md:block" />
        ) : null}
        <FaqSupportText
          prefix={supportPrefix}
          linkLabel={supportLinkLabel}
          href={supportHref}
          className="mt-6 hidden md:block"
        />
      </div>

      <div className="min-w-0 md:col-span-3">
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
