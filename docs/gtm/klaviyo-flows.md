# Klaviyo flow'd — cart & checkout abandonment

Praktiline juhend Motorock headless poe flow'de loomiseks pärast GTM trackingut.

**Eeldused:** GTM Klaviyo tagid live, Woo Klaviyo plugin ühendatud, checkout identify deploy'tud.

---

## Flow prioriteedid

| # | Flow | Miks |
|---|------|------|
| 1 | **Cart abandonment** | Kõige rohkem mahajäetud korve (nt 25 € tarne šokk) |
| 2 | Checkout abandonment | Jõudsid checkouti, ei maksnud |
| 3 | Browse abandonment | Hilisem, madalam konversioon |

Tellimuse **kinnitust** ära Klaviyosse — jääb WooCommerce emaili.

---

## 1. Cart abandonment (soovitus alustada siit)

### Klaviyo → Flows → Create flow → Build your own

**Trigger:** Metric → **Added to Cart**

**Filter (recommended):**
- Person has **not** done **Placed Order** since starting this flow
- (Optional) Person has done **Added to Cart** at least once in the last 3 days

**Time delay before first email:** **2 hours**  
(1h on agressiivne; 4h võib olla liiga hilja kuumadele ostudele)

### Email 1 (2h pärast)

**Subject (ET):** `Unustasid midagi ostukorvi?`  
**Subject (EN):** `Did you forget something?`

**Sisu:**
- Tervitus (first name, kui olemas)
- Dynamic block: **Abandoned cart** / **Checkout started** product block (Klaviyo e-commerce)
- CTA: **Tagasi ostukorvi** → `https://motorock.eu/et/cart` (või `/en/cart`)
- Maini tasuta tarne alates 200 € (kui korv &lt; 200 €)
- Jalus: info@motorock.eu, taganemisõigus

**Smart sending:** ON (ära saada liiga tihedalt)

### Email 2 (24h pärast Email 1, kui endiselt no Placed Order)

**Subject (ET):** `Sinu tooted ootavad veel`  
Pehmem meeldetuletus + sama CTA. Ära lisa allahindlust automaatselt (marginaal).

### Email 3 (optional, 72h)

Viimane meeldetuletus. Lülita flow välja kui conversion rate &lt; 0.5% pärast 2 kuud.

---

## 2. Checkout abandonment

**Trigger:** **Started Checkout**

**Filter:**
- Has not done **Placed Order** since starting flow

**Delay:** **1 hour**

**Email:**
- Subject (ET): `Sinu tellimus on peaaegu valmis`
- CTA otse checkouti: `https://motorock.eu/et/checkout`
- Maini makseviise (kaardid, Apple Pay, Montonio pangalingid riigiti)

**Märkus:** Kui klient sisestas e-maili checkoutis, **identify** seob varasema Added to Cart activity profiiliga — flow saadab õigele inimesele.

---

## 3. Browse abandonment

**Trigger:** **Viewed Product**

**Filter:**
- Has not done **Added to Cart** in the last 4 hours
- Has not done **Placed Order** in the last 7 days

**Delay:** **4 hours**

**Email:**
- Subject (ET): `Kas see {ProductName} meeldib sulle?`
- Dynamic block: viewed product
- CTA: tootelehe URL (Klaviyo populate)

Madalaim prioriteet — loo alles pärast cart flow testi.

---

## 4. Flow seaded (kõigile)

| Seade | Väärtus |
|-------|---------|
| **Smart sending** | ON |
| **Unsubscribe** | Klaviyo default + link footeris |
| **UTM parameters** | `utm_source=klaviyo&utm_medium=email&utm_campaign=cart-abandon` |
| **Language** | Kaks flow'd: ET segment + EN segment (kui list kasvab) |

### ET / EN segment (hiljem)

Woo plugin sync'ib `checkout_locale` meta. Klaviyo segment:
- Property `locale` = `et` või `checkout_locale` custom property
- Kui property puudub, saada EN default

---

## 5. Test enne live

1. **Test profile:** lisa oma email Klaviyosse
2. Preview mode flow's (Klaviyo → Enter preview)
3. Live test:
   - marketing consent ON
   - lisa toode korvi → oota 2h **või** vähenda delay test flow's 5 min peale
   - kontrolli Activity feed + inbox
4. Veendu, et **Woo order confirmation** ei duplikeeru

---

## 6. Mida mitte teha

- ❌ Placed Order welcome flow (Woo juba saadab)
- ❌ Liiga lühike delay (&lt; 30 min) — tundub spammina
- ❌ Automaatne kupong esimeses emailis (testi esmalt ilma)
- ❌ Sama flow nii Added to Cart kui Started Checkout triggeriga (segmenteeri)

---

## 7. Mõõdikud (2 nädalat pärast live)

| Metric | Hea algus |
|--------|-----------|
| Cart flow open rate | &gt; 35% |
| Cart flow click rate | &gt; 5% |
| Cart flow placed order rate | &gt; 2% |
| Unsubscribe rate | &lt; 0.5% |

Klaviyo → Flow → Analytics

---

## 8. Seos Woo payment reminderiga

| Stiim | Millal | Kes saadab |
|-------|--------|------------|
| Korv/checkout hülgamine | Enne tellimust | **Klaviyo flow** |
| Makse pooleli (pending order) | Pärast “Maksa” | **Woo `motorock-headless-payment-reminder.php`** |

Need **ei tohiks** kattuda — Klaviyo filtreerib “no Placed Order”; payment reminder läheb ainult pending/failed tellimustele.
