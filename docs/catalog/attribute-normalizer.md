# Motogirl attribute backfill

Normalizes existing variable products to a canonical Woo schema:

- `pa_color` — Black, Red, Yellow
- `pa_size` — `EU38 (UK10)` (slug `eu38-uk10`)
- `pa_leg-length` — petite | regular | tall

Variation **database IDs and SKUs are preserved** (in-place update).

## Deploy plugin

```bash
./scripts/deploy-wordpress-catalog-importer.sh --upload
```

## Dry run (Motogirl)

On `shop.motorock.eu`:

```bash
wp eval-file wp-content/plugins/motorock-catalog-importer/scripts/backfill-product-attributes.php motogirl --dry-run
```

## Apply

```bash
wp eval-file wp-content/plugins/motorock-catalog-importer/scripts/backfill-product-attributes.php motogirl
```

## After backfill

1. Revalidate storefront cache (Vercel deploy or `npm run revalidate`)
2. Test checkout: Fiona trousers — color + leg length + EU size → place test order
3. Old carts with legacy `size: "10"` still work via `variationId` + EU/UK matching

## Future imports

`Motorock_Catalog_Importer_Attribute_Normalizer` runs automatically in:

- `Product_Writer` (new variable products)
- `generic_csv` adapter (before write)

CSV can use raw supplier columns (`size_uk`, color codes in SKU); normalizer maps to EU labels.
