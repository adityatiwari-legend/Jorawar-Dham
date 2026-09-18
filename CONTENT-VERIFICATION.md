# श्री जोरावर धाम — Content Verification & Discrepancies Register
**Project:** Siddh Shri Jorawar Dham Seva Samiti (सिद्ध श्री जोरावर धाम सेवा समिति)  
**Standard:** ZERO FABRICATION / MANUAL HUMAN CONFIRMATION  
**Document Path:** `CONTENT-VERIFICATION.md`  
**Date:** September 18, 2026

---

## Purpose
This document logs every ambiguous, conflicting, or incomplete item identified in the legacy Shri Jorawar Dham source materials. Per the **Zero Fabrication** mandate, rather than making arbitrary assumptions or inventing synthetic data, these items are explicitly registered here for committee review and administrative sign-off.

---

## 1. Flagged Discrepancies & Resolutions

### Discrepancy 1: Map Coordinates / Legacy Embed Conflict
* **Source Material State:** The legacy contact page contained a third-party Google Maps `<iframe>` whose destination coordinates resolved to **Govardhan, Uttar Pradesh**.
* **Official Verified Record:** The legal registration of the Samiti is `COOP/2023/DHOLPUR/201054` and the official address is **ग्राम व पोस्ट चितौरा, तहसील सैंपऊ, जिला धौलपुर, राजस्थान - 328027**.
* **Mandate (Section 21):** *"Do NOT simply copy this legacy map iframe into the new website. Flag it as requiring location verification... use official address as text. Make the map location CMS-configurable. Do not invent coordinates."*
* **Resolution Implemented:** 
  1. The legacy Govardhan iframe was excluded.
  2. The official Dholpur address is displayed prominently in text.
  3. A visible Devotee Verification Banner is displayed explaining that legacy GPS coordinates are undergoing committee review.
  4. A dynamic Google Maps Search link using the official verified textual address (`ग्राम चितौरा तहसील सैंपऊ धौलपुर राजस्थान 328027`) is provided so pilgrims navigate accurately.
* **Human Verification Required:** Committee administrator should supply the exact Google Maps Place ID / latitude & longitude coordinates when surveyed on-site.

---

### Discrepancy 2: Bharatpur Distance Variance (75 km vs 95 km)
* **Source Material State:**
  * In the **History** section: *"भरतपुर — 95 किलोमीटर"*
  * In the **How to Reach** section: *"भरतपुर स्टेशन — 75 कि.मी."*
* **Analysis:** The difference likely reflects highway road distance to Bharatpur district center (95 km) versus the direct track/rail connection to Bharatpur Junction (75 km).
* **Resolution Implemented:** Zero data tampering. The 95 km figure is preserved in the History page context, and the 75 km figure is preserved in the How to Reach table.
* **Human Verification Required:** Committee to confirm preferred standard signage distance.

---

### Discrepancy 3: Tehsil Orthography (`सैंपऊ` vs `सैपऊ`)
* **Source Material State:** The legacy text intermittently spells the tehsil with and without the anusvara/bindi (`सैंपऊ` and `सैपऊ`).
* **Resolution Implemented:** 
  * Preserved `सैपऊ` in the short address string: *"ग्राम व पोस्ट - चितौरा, तहसील - सैपऊ, जिला धौलपुर (राज) - 328027"*.
  * Preserved `सैंपऊ` in the full postal narrative: *"ग्राम व पोस्ट चितौरा, तहसील सैंपऊ, जिला धौलपुर, राजस्थान - 328027"*.
  * Both forms are valid in standard Hindi orthography for the region.
* **Human Verification Required:** None required; both forms are recognized.

---

### Discrepancy 4: Incomplete Banking & Financial Credentials
* **Source Material State:** The legacy donation page showed empty placeholder tokens:
  ```text
  खाता सं0-
  बैंक व खाताधारक का नाम
  आईएफएससी कोड
  ऑनलाइन भुगतान
  यूपीआई आईडी
  क्यू आर कोड
  ```
* **Mandate (Section 16 & 27):** *"Do NOT invent bank account number, bank name, account holder, IFSC, UPI ID, or QR payment details... display an appropriate 'जानकारी शीघ्र उपलब्ध होगी' or keep fields CMS-configurable."*
* **Resolution Implemented:**
  1. Absolutely zero fake bank account numbers or IFSC codes were generated.
  2. A clear official banner *"दान बैंक विवरण — जानकारी शीघ्र उपलब्ध होगी"* is displayed.
  3. The three canonical modes of seva (*आर्थिक सहयोग, सामग्री दान, श्रमदान*) and the *"एक ईंट, एक दान"* campaign are fully detailed.
* **Human Verification Required:** Trust Treasurer / Committee to input the official verified bank account number, IFSC code, and merchant UPI ID via the admin CMS.

---

### Discrepancy 5: Legacy Image References vs Authentic Assets
* **Source Material State:** Legacy pages contained references to image paths such as `img/mohan.jpg`, `img/mohan1.jpg`, `img/ab1.jpg`, `img/ab2.jpg`.
* **Mandate (Section 24):** *"Do not invent replacement photographs of the deity or temple and present them as real photographs. If an image's authenticity is uncertain, do not label it as an actual photograph of the site."*
* **Resolution Implemented:**
  1. The committee's two official uploaded brand assets (`logo (1).png` and `icon.png`) have been formatted and deployed across navbar, footer, headers, and favicons.
  2. Architectural previews for the proposed grand temple are labeled clearly as conceptual illustrations or architectural models, maintaining total truthfulness.
* **Human Verification Required:** Committee to upload verified high-resolution photographs of the actual sanctum into the CMS gallery once ready.

---

## 2. Textual Normalization Register
As authorized by Section 25 (OCR & presentation typo correction without altering semantic facts):

| Original Legacy String | Normalized Hindi String | Meaning / Context |
| :--- | :--- | :--- |
| दर्षन | **दर्शन** | Sacred viewing / Darshan |
| विषाल | **विशाल** | Grand / Large (Fair / Complex) |
| आष्चर्यचकित | **आश्चर्यचकित** | Astonished / Divinely struck |
| वृतांत | **वृत्तांत** | Account / Story |
| प्रदेष | **प्रदेश** | Province / State (Rajasthan) |
| हमेषा | **हमेशा** | Always / Perpetual |

No historical dates, names, distances, or organizational statements were altered during normalization.
