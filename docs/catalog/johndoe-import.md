# John Doe catalog import

John Doe supplies a daily stock CSV (Frankfurt + outside warehouse). Motorock uses **VK_Brutto** as the WooCommerce regular price and **EK_Netto** as `_cost`.

## Data source

- URL (combined inside + outside):  
  `https://portal.ridejohndoe.com/stocklist/export_csv_with_outside_warehouse`
- Updated daily ~21:00 (Europe/Tallinn)
- Delimiter: `;` — columns include `ArtNr`, `Bezeichnung`, `Barcode`, `EK_Netto`, `VK_Brutto`, `Inside_Warehouse`, `Outside_Warehouse`

## Initial full import (recommended)

### 1. Generate WooCommerce CSV

```bash
# Download CSV + build import file (test with 20 parents)
npm run import:johndoe -- --fetch --limit 20

# Full catalog + Parts Europe images/descriptions (one-time, ~15–30 min)
npm run import:johndoe -- --fetch --build-pe-index

# Full catalog when PE index is already cached
npm run import:johndoe -- --fetch

# Initial launch: only products with Parts Europe images (~333 parents)
npm run import:johndoe -- --fetch --with-images-only
# Or from cached stock CSV:
npm run import:johndoe -- --input output/johndoe/source-stock.csv --with-images-only
```

Output:

- `output/johndoe/woocommerce-import.csv` — full catalog
- `output/johndoe/woocommerce-import-with-images.csv` — with `--with-images-only`
- Upload either file to **WooCommerce → Products → Import**
- `output/johndoe/import-summary.json` — stats
- `output/johndoe/.cache/partseurope-index.json` — copy to WP for plugin enrichment (optional)

### 2. WooCommerce import

1. **Products → Import** → upload `woocommerce-import.csv`
2. Map columns if prompted (should match standard Woo export headers)
3. Run import, then verify a variable product (e.g. `IJ8001`) and a simple protector (`A-CB-L-1`)

### 3. Storefront

After bulk import:

```bash
npm run revalidate
```

Add **John Doe** to `src/data/brands.ts` and map categories in WP admin when the brand goes live.

## Ongoing import via WP plugin

Deploy catalog importer:

```bash
./scripts/deploy-wordpress-catalog-importer.sh --upload
```

WP Admin → **Catalog Import**:

1. New feed → adapter **John Doe (stock CSV)**
2. Brand: `John Doe`
3. Price multiplier: `1` (VK_Brutto is final retail)
4. Upload daily CSV (or the file from `--fetch` saved as `source-stock.csv`)
5. **Full import** — first run creates products
6. **Update stock & prices only** — daily sync after catalog exists

Optional: copy `output/johndoe/.cache/partseurope-index.json` to  
`wp-content/uploads/motorock-catalog-importer/cache/johndoe-partseurope-index.json`  
so the plugin can attach images/descriptions during full import.

## Stock rules

| Source | Meaning |
|--------|---------|
| `Inside_Warehouse` | Frankfurt — fast fulfilment |
| `Outside_Warehouse` | Partner warehouse — allow ~10–14 extra days |
| Woo `stock` | `Inside + Outside` (total orderable qty) |
| Meta `_jd_inside_stock` / `_jd_outside_stock` | Breakdown for ops |

Toni recommends treating **Inside ≥ 5** as safer for customer-facing availability; the importer currently imports all rows with actual quantities.

## Categories

Inferred from product name when no manual mapping exists:

- Jackets, Pants, Gloves, Footwear, Protection, Accessories → under **John Doe**

Configure exact `product_cat` targets in the feed’s category mappings in WP admin.

## Content enrichment

- **ridejohndoe.com** — Cloudflare blocks automated scraping
- **Parts Europe** — used when vendor part numbers match (~half the catalog); run `--build-pe-index` once
- Missing images/descriptions: ask John Doe for a media pack or add manually in Woo

## Pricing

- **Regular price** = `VK_Brutto`
- **Cost** = `EK_Netto`
- Feed price multiplier = `1` (no markup on top of VK)
