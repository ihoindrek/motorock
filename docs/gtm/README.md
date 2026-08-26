# GTM import — Motorock

## Failid

| Fail | Eesmärk |
|------|---------|
| `motorock-meta-pixel-import.json` | Meta Pixel (ViewContent, AddToCart, …) |
| `motorock-klaviyo-import.json` | Klaviyo onsite (Viewed Product, Added to Cart, …) |
| `klaviyo-flows.md` | Cart / checkout / browse abandonment flow'd |
| `klaviyo-checklist.txt` | Klaviyo kiire checklist |
| `checkout-funnel-ga4-setup.md` | GA4 checkout funnel |

---

## Meta Pixel import

### Import sammud

1. Ava [Google Tag Manager](https://tagmanager.google.com) → vali **motorock.eu** container
2. **Admin** (vasakul all) → **Import Container**
3. **Choose container file** → vali `motorock-meta-pixel-import.json`
4. **Merge** → **Rename conflicting tags, triggers, and variables**
   - (Mitte Overwrite — see ei kustuta sinu GA4 jms tag'e)
5. **Confirm**

### Pärast importi (kohustuslik)

1. **Variables** → `CONST - Meta Pixel ID` → asenda `YOUR_PIXEL_ID` oma Meta Pixel ID-ga  
   (Events Manager → Data Sources → Pixel ID, nt `123456789012345`)

2. Kui sul on **juba Meta PageView pixel**:
   - **Tags** → lülita **VÄLJA** `Meta - Base Pixel (PageView)`  
   - Muidu dubleerid PageView eventi

3. Kui sul on **vanad Meta ViewContent tag'id** (All Pages / view_item_list):
   - **Keela või kustuta** need, et vältida 12 content_ids probleemi

4. **Preview** → testi tootelehel → `Meta - ViewContent` peab tulema **1 content_id**-ga

5. **Submit** → **Publish**

### Mis Meta fail sisaldab

| Tüüp | Nimi |
|------|------|
| Folder | Motorock — Meta Pixel |
| Variable | CONST - Meta Pixel ID |
| Variable | DLV - meta_content_ids, meta_content_type, meta_currency, meta_value, meta_transaction_id |
| Variable | CJS - meta_content_id_first |
| Trigger | CE - view_item, add_to_cart, begin_checkout, add_payment_info, purchase |
| Tag | Meta - Base Pixel (PageView) — kasutab sisseehitatud All Pages triggerit |
| Tag | Meta - ViewContent |
| Tag | Meta - AddToCart |
| Tag | Meta - InitiateCheckout |
| Tag | Meta - AddPaymentInfo |
| Tag | Meta - Purchase |

---

## Klaviyo import

Vaata **`klaviyo-setup.md`** ja **`klaviyo-checklist.txt`**.

1. Import `motorock-klaviyo-import.json` (Merge → Rename)
2. Sea `CONST - Klaviyo Public API Key`
3. Consent: `ad_storage` igal Klaviyo tagil
4. Jäta `Klaviyo - Placed Order (backup)` **paused** (Woo plugin)
5. Preview → Publish

---

## Consent (küpsised)

Sait kasutab Consent Mode'i. Kui Meta/Klaviyo pixel peab ootama marketing consent'i:

- Tags → iga tag → **Consent Settings** → Require `ad_storage` (või vastavalt sinu CMP seadistusele)

Import failides on consent `NOT_SET` — sea GTM-is pärast importi.

## Sait + GTM koos

Saidi analytics deploy (variation ID fix) teeb `meta_content_ids` täpsemaks.  
Kui see pole veel live'is, küsi deploy'i — GTM import töötab ikkagi, aga ID-d võivad olla parent product ID kuni deploy'ini.
