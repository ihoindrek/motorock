# John Doe catalog import

John Doe supplies a daily stock CSV (Frankfurt + outside warehouse). Motorock uses **VK_Brutto** as the WooCommerce regular price and **EK_Netto** as `_cost`.

## Data source

- URL (combined inside + outside):  
  `https://portal.ridejohndoe.com/stocklist/export_csv_with_outside_warehouse`
- Updated daily ~21:00 (Europe/Tallinn)
- Delimiter: `;` — columns include `ArtNr`, `Bezeichnung`, `Barcode`, `EK_Netto`, `VK_Brutto`, `Inside_Warehouse`, `Outside_Warehouse`

## Initial full import (recommended)

Use **WooCommerce → Catalog Import** in WP admin (plugin already deployed on shop.motorock.eu).

1. **New feed** → adapter **John Doe (stock CSV)**
2. Brand: `John Doe`, Price multiplier: `1`
3. **Category mapping** — map each `John Doe > Men/Women > …` label to Motorock categories (see table below) → **Save**
4. Upload stock CSV (or use server copy at `uploads/motorock-catalog-importer/csv/johndoe-source.csv`)
5. **Full import** — creates variable products (letter sizes + waist/inseam e.g. `30/32`)
6. After import: `npm run revalidate`

Parts Europe image cache is on the server at  
`uploads/motorock-catalog-importer/cache/johndoe-partseurope-index.json` (~86 parent products with images).

### Optional: generate WooCommerce CSV locally

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

Importer infers **gender + product type** from the product name and SKU (stock CSV has no category column).

**Label format:** `John Doe > Men > Jackets` or `John Doe > Women > T-Shirts`

**Gender rules:**

| Signal | Audience |
|--------|----------|
| `Women`, `Woman`, `Jeggings` in name | Women |
| `Men`, `Men's` in name | Men |
| SKU prefix `JW`, `JLE800`, `JHK800`, `MJDD`, `MJDC` | Women |
| Names like `Ruby`, `Betty`, `Jackie` | Women |
| Everything else | Men |

**Product types:** Jackets, Motoshirts, Vests, Hoodies & Sweaters, T-Shirts, Pants, Gloves, Footwear, Eyewear, Protection, Accessories, Other

### Recommended Catalog Import mapping (Motorock)

| Source label | Map to WooCommerce |
|--------------|-------------------|
| `John Doe > Men > Jackets` | For men › Jackets & tags |
| `John Doe > Women > Jackets` | For women › Jackets & tags |
| `John Doe > Men > Motoshirts` | For men › Jackets & tags |
| `John Doe > Women > Motoshirts` | For women › Jackets & tags |
| `John Doe > Men > Vests` | For men › Vests |
| `John Doe > Women > Vests` | For women › Vests |
| `John Doe > Men > Hoodies & Sweaters` | For men › Sweaters |
| `John Doe > Women > Hoodies & Sweaters` | For women › Hoodies & sweatshirts |
| `John Doe > Men > T-Shirts` | For men › T-shirts |
| `John Doe > Women > T-Shirts` | For women › T-shirts & jerseys |
| `John Doe > Men > Pants` | For men › Pants |
| `John Doe > Women > Pants` | For women › Pants & jeans |
| `John Doe > Men > Gloves` | For men › Gloves |
| `John Doe > Women > Gloves` | For women › Gloves |
| `John Doe > Men > Footwear` | For men › Footwear |
| `John Doe > Women > Footwear` | For women › Footwear |
| `John Doe > Men > Protection` | Accessories › Protection (or brand subcat) |
| `John Doe > Men > Eyewear` | Accessories › Goggles |
| `John Doe > Men > Accessories` | Accessories (caps, tubes, belts…) |
| `John Doe > Men > Other` / `Women > Other` | Review manually or default brand category |

After mapping, **Full import** assigns Woo categories so storefront **For men / For women** filters work.

## Content enrichment

- **ridejohndoe.com** — Cloudflare blocks automated scraping
- **Parts Europe** — used when vendor part numbers match (~half the catalog); run `--build-pe-index` once
- Missing images/descriptions: ask John Doe for a media pack or add manually in Woo

## Pricing

- **Regular price** = `VK_Brutto`
- **Cost** = `EK_Netto`
- Feed price multiplier = `1` (no markup on top of VK)
