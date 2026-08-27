# Size guides

Size guides are matched **automatically** to products — no per-product setup for normal cases.

## How matching works

Each size guide in **Products → Size guides** defines:

| Field | Purpose |
|-------|---------|
| **Brand** | Storefront brand slug (`johnny-reb`, `pando-moto`, …) |
| **Product category** | `vests`, `jackets`, `pants`, … |
| **Gender** | `men`, `women`, or `unisex` |

A product shows a guide when all three match:

```
product.brand  +  product.category  +  product.gender
       ↓                  ↓                    ↓
   johnny-reb           vests                 men
```

Gender fallback: if no gender-specific chart exists, `unisex` is tried.

## Product override (exceptions only)

**Products → edit product → Size guide override** — use only when one product needs a different chart than the rest of its brand/category (e.g. special fit). Leave **empty** for automatic matching.

## Examples

| Size guide | Brand | Category | Gender | Applies to |
|------------|-------|----------|--------|------------|
| Johnny Reb Vests for Men | johnny-reb | vests | men | All men's Johnny Reb vests |
| Johnny Reb Vests for Women | johnny-reb | vests | women | All women's Johnny Reb vests |
| Pando Moto Jackets | pando-moto | jackets | men | Men's Pando Moto jackets |

## After saving a size guide

Storefront cache refreshes automatically (~1–2 min). No bulk product edits required.

## Pilot fallback charts

If WP returns no guides, the storefront falls back to hard-coded pilot charts in `src/data/size-guides/catalog.ts` (Pando Moto jackets, Johnny Reb pants, Holyfreedom hoodies).
