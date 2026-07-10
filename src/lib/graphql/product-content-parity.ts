import type { GraphQLProduct } from "@/lib/graphql/types";

export function normalizeProductHtmlForCompare(html: string | null | undefined) {
  return (html ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[#\w]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function isSameProductContent(
  left: Pick<GraphQLProduct, "shortDescription" | "description">,
  right: Pick<GraphQLProduct, "shortDescription" | "description">,
) {
  return (
    normalizeProductHtmlForCompare(left.shortDescription) ===
      normalizeProductHtmlForCompare(right.shortDescription) &&
    normalizeProductHtmlForCompare(left.description) ===
      normalizeProductHtmlForCompare(right.description)
  );
}
