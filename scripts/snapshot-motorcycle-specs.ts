/**
 * Backfill motorcycle spec meta for products whose supplier HTML was overwritten by AI.
 *
 * Prefer filling ACF `motorcycle_specs_html` in Woo instead — this script is for legacy backfill.
 *
 * Usage (after restoring original description in Woo or pasting specs HTML into ACF):
 *   npx tsx scripts/snapshot-motorcycle-specs.ts 25800 en
 */
import { getAiConfig } from "@/lib/ai/config";
import { GraphqlProductReadRepository } from "@/lib/ai/repositories/graphql-product-read.repository";
import { WpAiWriteRepository } from "@/lib/ai/repositories/wp-ai-write.repository";
import {
  buildMotorcycleSpecSnapshot,
  serializeMotorcycleSpecSnapshot,
} from "@/lib/shop/motorcycle-spec-snapshot";

async function main() {
  const productId = Number(process.argv[2]);
  const locale = (process.argv[3] ?? "en") as "en" | "et";

  if (!Number.isInteger(productId) || productId <= 0) {
    console.error("Usage: npx tsx scripts/snapshot-motorcycle-specs.ts <productId> [locale]");
    process.exit(1);
  }

  const config = getAiConfig();
  const productRead = new GraphqlProductReadRepository();
  const productWrite = new WpAiWriteRepository(config.wpWriteUrl, config.wpWriteSecret);

  const product = await productRead.getById(productId, locale);
  if (!product) {
    console.error(`Product ${productId} not found`);
    process.exit(1);
  }

  if (product.productType !== "motorcycle") {
    console.error(`Product ${productId} is not a motorcycle`);
    process.exit(1);
  }

  const supplierHtml = product.existing.description?.trim() ?? "";
  const snapshot = buildMotorcycleSpecSnapshot(
    supplierHtml,
    product.existing.shortDescription ?? "",
    locale,
  );

  if (!snapshot) {
    console.error(
      "No specs found in description. Restore the original Motomad/supplier HTML in Woo first (Revisions), then rerun.",
    );
    process.exit(1);
  }

  await productWrite.write({
    productId: product.productId,
    locale,
    sections: [],
    meta: {
      provider: "manual",
      promptVersion: "snapshot",
      model: "snapshot",
      generatedAt: new Date().toISOString(),
      jobId: `snapshot_${Date.now()}`,
    },
    motorcycle: {
      supplierDescriptionHtml: supplierHtml,
      specsSnapshotJson: serializeMotorcycleSpecSnapshot(snapshot),
    },
  });

  console.log(
    `Saved spec snapshot for ${productId} (${locale}):`,
    snapshot.engineSpecs.length,
    "engine,",
    snapshot.extendedSpecs.length,
    "extended,",
    snapshot.dimensionSpecs.length,
    "dimension",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
