import { unstable_cache } from "next/cache";
import { fallbackSizeGuides } from "@/data/size-guides/catalog";
import { getWooStoreUrl } from "@/lib/storefront/url";
import {
  parseRemoteSizeGuide,
  remoteSizeGuidesResponseSchema,
} from "@/lib/shop/parse-size-guide";
import {
  buildSizeGuideRegistry,
  type SizeGuideRegistry,
} from "@/lib/shop/size-guide-registry";
import type { SizeGuide } from "@/types/size-guide";

const SIZE_GUIDES_CACHE_TAG = "size-guides";
const SIZE_GUIDES_REVALIDATE_SECONDS = 3600;

async function fetchRemoteSizeGuides(): Promise<readonly SizeGuide[]> {
  const endpoint = `${getWooStoreUrl()}/wp-json/motorock/v1/size-guides`;

  try {
    const response = await fetch(endpoint, {
      next: {
        tags: [SIZE_GUIDES_CACHE_TAG],
        revalidate: SIZE_GUIDES_REVALIDATE_SECONDS,
      },
    });

    if (!response.ok) {
      return fallbackSizeGuides;
    }

    const payload: unknown = await response.json();
    const parsed = remoteSizeGuidesResponseSchema.safeParse(payload);
    if (!parsed.success) {
      return fallbackSizeGuides;
    }

    const guides = parsed.data.guides
      .map(parseRemoteSizeGuide)
      .filter((guide): guide is SizeGuide => guide !== null);

    return guides.length > 0 ? guides : fallbackSizeGuides;
  } catch {
    return fallbackSizeGuides;
  }
}

export const getSizeGuideRegistry = unstable_cache(
  async (): Promise<SizeGuideRegistry> => {
    const guides = await fetchRemoteSizeGuides();
    return buildSizeGuideRegistry(guides);
  },
  ["size-guide-registry"],
  {
    revalidate: SIZE_GUIDES_REVALIDATE_SECONDS,
    tags: [SIZE_GUIDES_CACHE_TAG],
  },
);
