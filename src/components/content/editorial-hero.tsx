import { BlogEditorialColumn, blogEditorialShellClassName } from "@/components/blog/blog-editorial-column";

type HeroBackground = "ink" | "paper" | "moto";

type EditorialHeroProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  accent?: string;
  /** @deprecated Use `background` instead */
  dark?: boolean;
  background?: HeroBackground;
};

const heroBackgroundClassName: Record<HeroBackground, string> = {
  ink: "bg-ink text-paper",
  paper: "bg-paper text-ink",
  moto: "bg-moto text-ink",
};

const heroDescriptionClassName: Record<HeroBackground, string> = {
  ink: "text-paper/75",
  paper: "text-ink/65",
  moto: "text-ink/65",
};

export function EditorialHero({
  eyebrow,
  title,
  description,
  accent,
  dark = true,
  background,
}: EditorialHeroProps) {
  const resolvedBackground = background ?? (dark ? "ink" : "paper");

  return (
    <header
      className={`relative overflow-hidden py-16 lg:py-24 ${blogEditorialShellClassName} ${heroBackgroundClassName[resolvedBackground]} ${
        resolvedBackground === "paper" ? "lg:py-20" : ""
      }`}
    >
      <BlogEditorialColumn className="relative z-10 flex flex-col gap-5">
        {eyebrow ? <p className="section-eyebrow">{eyebrow}</p> : null}
        <h1 className="text-4xl font-extrabold uppercase leading-[0.95] tracking-tight sm:text-5xl lg:text-6xl">
          {title}
          {accent ? (
            <>
              <br />
              <span className="bg-gradient-to-r from-[#FF5A00] via-[#ff7e26] to-[#ff9c59] bg-clip-text text-transparent">
                {accent}
              </span>
            </>
          ) : null}
        </h1>
        {description ? (
          <p
            className={`max-w-2xl text-base leading-relaxed sm:text-lg ${heroDescriptionClassName[resolvedBackground]}`}
          >
            {description}
          </p>
        ) : null}
      </BlogEditorialColumn>
    </header>
  );
}
