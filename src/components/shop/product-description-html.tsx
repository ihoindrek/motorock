import { hasRichHtmlDescription } from "@/lib/shop/parse-product-description";

type ProductDescriptionHtmlProps = {
  html: string;
  theme?: "light" | "dark";
};

export function ProductDescriptionHtml({
  html,
  theme = "light",
}: ProductDescriptionHtmlProps) {
  const isDark = theme === "dark";
  const rich = hasRichHtmlDescription(html);

  return (
    <div
      className={`product-description prose max-w-none text-sm leading-relaxed sm:text-base ${
        isDark ? "prose-invert text-paper/80" : "text-ink/75"
      } ${rich ? "prose-table:w-full" : ""}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
