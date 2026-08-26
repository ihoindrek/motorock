# GTM → Klaviyo seadistus (motorock.eu)

Juhend headless poe dataLayer → Klaviyo onsite tracking seadistamiseks Google Tag Manageris.

**Viimati uuendatud:** 26. august 2026  
**Saidi dataLayer:** `src/lib/analytics/data-layer.ts`  
**Import fail:** `docs/gtm/motorock-klaviyo-import.json`

---

## Arhitektuur

| Kiht | Kus | Mida teeb |
|------|-----|-----------|
| **WooCommerce plugin** | `shop.motorock.eu` | Placed Order, kliendid, tooted (server-side) |
| **GTM (see juhend)** | `motorock.eu` | Viewed Product, Added to Cart, Started Checkout |

GTM **ei asenda** Woo pluginat — täiendab käitumistrackingut enne tellimust (hüljatud korv, browse abandonment).

---

## 1. Klaviyo konto

1. Klaviyo onboarding → vali **WooCommerce** (mitte Custom built)
2. Installi **Klaviyo for WooCommerce** `shop.motorock.eu`-s
3. Oota historical sync (tellimused, kliendid, tooted)
4. Võta **Public API Key** (Site ID): Klaviyo → **Settings → Account → API keys**  
   - Otsid 6-tähelist võtit (nt `Xk9AbC`) — see läheb GTM-i

---

## 2. GTM import

1. [Google Tag Manager](https://tagmanager.google.com) → **motorock.eu** container
2. **Admin → Import Container**
3. Vali `docs/gtm/motorock-klaviyo-import.json`
4. **Merge → Rename conflicting tags, triggers, and variables**
5. **Confirm**

---

## 3. Pärast importi (kohustuslik)

### A) Public API Key

**Variables → `CONST - Klaviyo Public API Key`** → asenda `YOUR_PUBLIC_API_KEY`

### B) Consent (GDPR)

Iga Klaviyo tag → **Consent Settings** → **Require additional consent for tag to fire**:

- `ad_storage` (sama mis Meta pixel)

Sait ei pushi dataLayer evente ilma marketing consentita (`canSendAnalyticsEvents`), aga **Klaviyo base script** peab samuti consenti ootama.

### C) Placed Order duplikaat

Import failis on **`Klaviyo - Placed Order (backup)`** vaikimisi **paused**.

- Kui Woo Klaviyo plugin on ühendatud → **jäta välja lülitatud** (Woo saadab Placed Order)
- Kui Woo plugin puudub → lülita see tag sisse

---

## 4. Eventide kaardistus

| dataLayer `event` | Klaviyo metric | GTM tag |
|-------------------|----------------|---------|
| `view_item` | Viewed Product | Klaviyo - Viewed Product |
| `add_to_cart` | Added to Cart | Klaviyo - Added to Cart |
| `begin_checkout` | Started Checkout | Klaviyo - Started Checkout |
| `purchase` | Placed Order | Klaviyo - Placed Order (backup, paused) |
| `view_item_list` | **ära kasuta** | — |
| `view_cart` | valikuline | — |

---

## 5. dataLayer näited

### Tooteleht (`view_item`)

```json
{
  "event": "view_item",
  "ecommerce": {
    "currency": "EUR",
    "value": 249,
    "items": [{
      "item_id": "22398",
      "item_name": "Brixton Cromwell 1200",
      "item_brand": "Brixton",
      "item_category": "Motorcycles",
      "price": 249,
      "quantity": 1
    }]
  }
}
```

GTM mapib `items[0]` → Klaviyo `ProductID`, `ProductName`, `Price`, `Brand`, `Categories`.

---

## 6. Testimine (GTM Preview)

1. **Preview** → connect `https://motorock.eu` (või localhost — vajab marketing consent + GTM)
2. Nõustu **marketing** küpsistega
3. Kontrolli:

| Tegevus | GTM tag peaks tulema |
|---------|----------------------|
| Tooteleht | Klaviyo - Viewed Product |
| Lisa ostukorvi | Klaviyo - Added to Cart |
| Checkout samm 1 | Klaviyo - Started Checkout |

4. Klaviyo → **Analytics → Metrics → Viewed Product** → **Activity feed** — peaks ilmuma ~minuti jooksul

---

## 7. Flow'd (pärast trackingut)

Klaviyo → **Flows → Create flow**:

| Flow | Trigger | Delay |
|------|---------|-------|
| Browse abandonment | Viewed Product, no Added to Cart | 4h |
| **Cart abandonment** | Added to Cart, no Placed Order | 1–4h |
| Checkout abandonment | Started Checkout, no Placed Order | 1h |

Placed Order flow **ära loo** — WooCommerce kinnitusmail jääb Woo'sse.

---

## 8. Troubleshooting

### “Added to Cart — No metrics found” flow’s

Klaviyo **ei näita metricut**, kuni account on saanud **vähemalt ühe** sellise eventi. Flow builder ei leia midagi, mida pole veel olemas.

**Kiire test (live sait, ~5 min):**

1. Ava `motorock.eu` **inkognito**
2. Nõustu küpsistega → **Nõustu kõigiga** (vajalik **turundus** consent Klaviyo jaoks)
3. Ava toode → **Lisa ostukorvi**
4. Oota **2–5 min**
5. Klaviyo → **Analytics → Metrics** — otsi **Added to Cart**
6. Kui metric on olemas → **Flows** → trigger hakkab seda pakkuma

**Käsitsi test (brauseri console, pärast marketing consent):**

```javascript
window._learnq = window._learnq || [];
window._learnq.push(['track', 'Added to Cart', {
  ProductName: 'Test',
  ProductID: '999',
  SKU: '999',
  Price: 10,
  Quantity: 1,
  RowTotal: 10
}]);
```

**Kui metric endiselt puudub, kontrolli:**

| Kontroll | Ootus |
|--------|--------|
| GTM **Published** (mitte ainult Preview) | Jah |
| `CONST - Klaviyo Public API Key` õige | 6-tähemärk |
| Klaviyo tagid → consent **ad_storage** | Seadistatud |
| **Turundus** küpsis ON | Jah (statistika alone ei piisa Klaviyo scriptile) |
| GTM Preview | `Klaviyo - Added to Cart` fires |
| Network → `klaviyo.com` | Päringuid peale script load |

**Deploy:** saidikood saadab nüüd Klaviyo evente otse (`trackKlaviyoAddedToCart`) — töötab koos GTM-iga, vajab marketing consent + GTM base script.

---

## 9. Troubleshooting (üldine)

| Probleem | Lahendus |
|----------|----------|
| Ühtegi eventi ei tule | Marketing consent antud? GTM Preview → kas dataLayer eventid tulevad? |
| Viewed Product puudub | Trigger peab olema `view_item`, mitte `view_item_list` |
| Duplikaat Placed Order | Lülita **Klaviyo - Placed Order (backup)** välja; kasuta Woo pluginat |
| Klaviyo script ei lae | Kontrolli Public API Key; adblocker |
| localhost ei tööta | `NEXT_PUBLIC_GTM_ID` `.env.local`-is; consent banner |

---

## 9. Checklist enne Publish

- [ ] `CONST - Klaviyo Public API Key` seadistatud
- [ ] Kõik Klaviyo tagid → consent `ad_storage`
- [ ] `Klaviyo - Placed Order (backup)` **paused** (Woo plugin aktiivne)
- [ ] Preview: view_item, add_to_cart, begin_checkout töötavad
- [ ] Klaviyo Activity feed näitab evente
- [ ] **Publish** GTM container

---

## 10. Järgmised sammud (optional)

- Checkout **identify** e-mailiga — `identifyKlaviyoProfile()` checkoutis (marketing consent)
- Flow juhend: **`klaviyo-flows.md`**
- ET/EN segmentid Klaviyos (`checkout_locale` Woo'st)
