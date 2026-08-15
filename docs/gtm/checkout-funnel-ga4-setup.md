# GTM → GA4 checkout funnel (motorock.eu)

Juhend uute `checkout_*` dataLayer eventide seadistamiseks Google Tag Manageris ja GA4-s.

**Viimati uuendatud:** 2026-08-15  
**Saidi kood:** `src/lib/analytics/checkout-funnel.ts`  
**DataLayer push:** `src/lib/analytics/data-layer.ts`

---

## 1. Mida sait saadab

Iga event tuleb dataLayer'isse kujul:

```javascript
dataLayer.push({ ecommerce: null, meta_content_ids: undefined, /* ... */ });
dataLayer.push({
  event: "checkout_country_selected",
  country_code: "EE"
});
```

> Esimene push tühjendab `ecommerce` — GA4 checkout tagid peavad kuulama **ainult** `checkout_*` custom evente, mitte `ecommerce` objekti.

### Eventide näited

**checkout_country_selected**
```json
{ "event": "checkout_country_selected", "country_code": "EE" }
```

**checkout_shipping_rates_loaded**
```json
{ "event": "checkout_shipping_rates_loaded", "country_code": "EE", "rate_count": 4 }
```

**checkout_shipping_rates_failed**
```json
{ "event": "checkout_shipping_rates_failed", "country_code": "EE", "reason": "zero_rates" }
```

`reason` väärtused koodis:
- `zero_rates`
- `zero_rates_after_recovery`
- `request_failed`
- `bootstrap_failed`

**checkout_submit_blocked**
```json
{ "event": "checkout_submit_blocked", "reason": "Vali makseviis." }
```
(`reason` on kasutajale nähtav tekst ET/EN.)

**checkout_payment_return**
```json
{ "event": "checkout_payment_return", "outcome": "error", "error": "Payment cancelled" }
```
`outcome`: `redirect` | `error` | `resume`

**checkout_draft_restored**
```json
{ "event": "checkout_draft_restored", "had_payment": true, "had_pickup": false }
```

---

## 2. GA4 Admin — custom definitions (tee enne GTM publish)

**GA4 → Admin → Data display → Custom definitions → Create custom dimensions**

| Dimension name | Scope | Event parameter |
|----------------|-------|-----------------|
| Checkout country | Event | `country_code` |
| Checkout rate count | Event | `rate_count` |
| Checkout fail reason | Event | `reason` |
| Checkout block reason | Event | `reason` *(sama parameeter, teine event)* |
| Checkout payment outcome | Event | `outcome` |
| Checkout payment error | Event | `error` |
| Checkout had payment (draft) | Event | `had_payment` |
| Checkout had pickup (draft) | Event | `had_pickup` |

> GA4-s võib `reason` olla üks dimension mõlema eventi jaoks (`checkout_shipping_rates_failed` + `checkout_submit_blocked`).

---

## 3. GTM Variables

**GTM → Variables → New → Data Layer Variable**

| Variable name | Data Layer Variable Name |
|---------------|--------------------------|
| `DLV - event` | `event` |
| `DLV - country_code` | `country_code` |
| `DLV - rate_count` | `rate_count` |
| `DLV - reason` | `reason` |
| `DLV - outcome` | `outcome` |
| `DLV - error` | `error` |
| `DLV - had_payment` | `had_payment` |
| `DLV - had_pickup` | `had_pickup` |

*(Kui `DLV - event` on juba olemas Meta juhendist, ära duplikeeri.)*

---

## 4. GTM Triggers

**GTM → Triggers → New → Custom Event**

| Trigger name | Event name | Match |
|--------------|------------|-------|
| `CE - checkout_country_selected` | `checkout_country_selected` | Equals |
| `CE - checkout_shipping_rates_loaded` | `checkout_shipping_rates_loaded` | Equals |
| `CE - checkout_shipping_rates_failed` | `checkout_shipping_rates_failed` | Equals |
| `CE - checkout_submit_blocked` | `checkout_submit_blocked` | Equals |
| `CE - checkout_payment_return` | `checkout_payment_return` | Equals |
| `CE - checkout_draft_restored` | `checkout_draft_restored` | Equals |

**Valikuline üks trigger kõigile:**
- Name: `CE - checkout_funnel (regex)`
- Event name: `checkout_.*`
- Match: **Regex**

---

## 5. GTM Tags — GA4 Event

Kasuta olemasolevat **Google Tag → GA4 Configuration** tagi (Measurement ID `G-XXXX`).  
Kui sul on juba **GA4 Event** tagid `begin_checkout`, `purchase` jne, jälgi sama mustrit.

### Variant A — üks tag kõigile (soovitatav)

**Tag name:** `GA4 - checkout funnel events`  
**Tag type:** Google Analytics: GA4 Event  
**Configuration Tag:** *(sinu GA4 Configuration tag)*  
**Event Name:** `{{DLV - event}}`  
**Trigger:** `CE - checkout_funnel (regex)`

**Event Parameters** (Add parameter):

| Parameter name | Value |
|----------------|-------|
| `country_code` | `{{DLV - country_code}}` |
| `rate_count` | `{{DLV - rate_count}}` |
| `reason` | `{{DLV - reason}}` |
| `outcome` | `{{DLV - outcome}}` |
| `error` | `{{DLV - error}}` |
| `had_payment` | `{{DLV - had_payment}}` |
| `had_pickup` | `{{DLV - had_pickup}}` |

GA4 ignoreerib tühje parameetreid — kõik võib olla ühes tagis.

### Variant B — eraldi tag eventi kohta

Näide **checkout_country_selected**:

| Väli | Väärtus |
|------|---------|
| Event Name | `checkout_country_selected` |
| Trigger | `CE - checkout_country_selected` |
| Event parameter | `country_code` = `{{DLV - country_code}}` |

Korda teiste eventide jaoks (selgem debug GTM Preview's, rohkem tag'e).

---

## 6. Consent

Sait saadab analytics evente ainult kui:
- `NEXT_PUBLIC_GTM_ID` on seadistatud
- kasutaja on **statistika/küpsised** nõustunud (`canSendAnalyticsEvents()`)

**GTM → iga GA4 checkout tag → Consent Settings:**
- Require **`analytics_storage`** (või vastavalt sinu CMP Consent Mode seadistusele)

Preview testimisel localhost'il **nõustu statistika küpsistega** enne checkout'i testi.

---

## 7. Testimine (GTM Preview)

1. GTM → **Preview** → connect `http://localhost:3000` või `https://motorock.eu`
2. Nõustu statistika küpsistega
3. Ava `/et/cart`, lisa toode korvi
4. **Data Layer** tab — vali riik → peaks tulema:
   ```json
   { "event": "checkout_country_selected", "country_code": "EE" }
   ```
5. Pärast tarneviiside laadimist:
   ```json
   { "event": "checkout_shipping_rates_loaded", "country_code": "EE", "rate_count": N }
   ```
6. **Tags** tab — `GA4 - checkout funnel events` peaks **Fired**
7. GA4 → **Admin → DebugView** (kui debug mode sisse) — näed evente reaalajas

### Kiire browser console test (dev)

```javascript
// Pärast statistika consent'i:
dataLayer.filter(e => e.event?.startsWith?.('checkout_'))
```

---

## 8. GA4 Explorations — funnel

**Explore → Funnel exploration**

Suggested steps (Active users):

1. `begin_checkout` *(olemasolev ecommerce event)*
2. `checkout_country_selected`
3. `checkout_shipping_rates_loaded`
4. `add_shipping_info` *(olemasolev — kui delivery ready)*
5. `add_payment_info`
6. `purchase`

**Breakdown:** Device category (mobile / desktop) — võrdle CSV exportiga.

**Segment drop-off:**
- `checkout_shipping_rates_failed` where `reason` = `zero_rates` or `zero_rates_after_recovery`
- `checkout_submit_blocked` — vaata `reason` parameetrit
- `checkout_payment_return` where `outcome` = `error`

---

## 9. Checklist enne Publish

- [ ] GA4 custom dimensions loodud (§2)
- [ ] DLV muutujad loodud (§3)
- [ ] Trigger(id) loodud (§4)
- [ ] GA4 Event tag seotud Configuration tagiga (§5)
- [ ] Consent `analytics_storage` nõutud
- [ ] Preview: riigi valik → `checkout_country_selected`
- [ ] Preview: tarne laeb → `checkout_shipping_rates_loaded`
- [ ] DebugView näitab evente
- [ ] **Publish** GTM container

---

## 10. Seotud saidi deploy

Need eventid on saidi koodis alates checkout UX uuendusest. Enne production funnel analüüsi veendu, et muudatused on **deploy'tud motorock.eu**-le (mitte ainult localhost).

| Fail | Roll |
|------|------|
| `src/lib/analytics/checkout-funnel.ts` | Eventide definitsioonid |
| `src/hooks/use-checkout-shipping.ts` | country / rates loaded / failed |
| `src/components/shop/cart-checkout-view.tsx` | submit blocked / payment return / draft |
