# Before-and-After Technical Comparison Diff

- **Execution Run ID:** `run-2026-11-23T10-18-48-149Z`
- **Execution Timestamp:** `2026-11-23T10:18:48.149Z`
- **Test Engine:** Node.js v24.12.0 + Playwright (Headless Chromium)
- **Host Binding:** `127.0.0.1`
- **Overall Suite Status:** `ALL VERIFICATIONS PASSED`

## Summary Matrix

| Defect Area | Baseline (Unfixed) | Corrected (Fixed) | Verification Status |
| :--- | :--- | :--- | :--- |
| **Defect 1: Raw HTML Content Delivery** | **FAIL: Raw visible body coverage 0%. Missing: 6 facts (Product Title, Visible Price, Product SKU, Primary Active (Niacinamide), Secondary Active (Ceramide NP), INCI Formulation Base). Product facts missing from server-delivered HTML.** | **PASS: Raw visible body coverage 100%. 100% parity (6/6 observable facts present in raw DOM).** | **VERIFIED RESOLVED** |
| **Defect 2: Schema.org JSON-LD Structured Data** | **FAIL: 4 validation errors (Product node #1 (Block #1) is missing a valid 'sku' property.; Product node #1 (Block #1) is missing mandatory commercial property 'offers'.; Discrepancy: Product node #1 (Block #1) name ("Generic Serum") does not match visible title ("Radiant Barrier Defense Serum").; Invalid description: Product node #1 (Block #1) description is incomplete or too short (10 characters: "Skin serum").)** | **PASS: 0 errors. Local schema validation passed. Visible facts synchronized. Zero fabricated ratings.** | **VERIFIED RESOLVED** |
| **Defect 3: Canonical & Indexability Directives** | **FAIL: Active robots: ["noindex, nofollow"], Canonical: ["http://staging-preprod.aurabotanica.internal/products/radiant-barrier-serum"]. Canonical targets staging environment. Errors: Raw HTML meta[name="robots"] contains indexing blocker: "noindex, nofollow".; Canonical URL uses insecure HTTP protocol ("http://staging-preprod.aurabotanica.internal/products/radiant-barrier-serum").; Canonical URL mismatch: expected simulated production URL "https://demo.aurabotanica.example/products/radiant-barrier-serum", found "http://staging-preprod.aurabotanica.internal/products/radiant-barrier-serum"..** | **PASS: ["index, follow"]. Canonical: ["https://demo.aurabotanica.example/products/radiant-barrier-serum"]. Points to simulated production HTTPS canonical.** | **VERIFIED RESOLVED** |

---

## Negative Fixture, Mutation & Regression Verification

- **Structured Data & Directive Negative Fixtures:** ✅ All 41/41 structured data fixtures correctly evaluated (negative cases rejected, positive formatting accepted).
- **End-to-End Page Mutations:** ✅ All 25/25 page mutations correctly detected and rejected.
- **Regression & Report Integrity:** ✅ PASS: Injected noindex produced FAIL/UNRESOLVED; Injected negative fixture failure produced VERIFICATION FAILED.

---

## Real Extracted Code & Payload Snippets

### Defect 1: Raw HTML Server Delivery

#### Actual Captured Baseline Snippet (`evidence/baseline/raw-html-product.html`)
```html
<div id="client-product-container">
        <div class="loading-skeleton">
          <p><strong>Loading formulation details and product specifications...</strong></p>
          <p style="font-size: 0.85rem; margin-top: 0.5rem;">
            <em>(Raw HTML crawler notice: Server response payload contains no product title, ingredients, clinical specifications, or pricing.)</em>
          </p>
        </div>
      </div>
    </div>
  </main>

  <footer>
    <p>Aura Botanica Demonstration Laboratory &bull; Controlled Technical SEO Case Study &bull; Not an active commercial business.</p>
  </footer>
```

#### Actual Captured Corrected Snippet (`evidence/fixed/raw-html-product.html`)
```html
<div id="product-content">
        <div class="product-meta-header">
          <div class="category-breadcrumbs">Skincare / Facial Serums</div>
          <h1 class="product-title" id="visible-title">Radiant Barrier Defense Serum</h1>
          <div class="price-row">
            <span class="price-value" id="visible-price">$38.00 USD</span>
            <span class="sku-tag" id="visible-sku">SKU: AB-RDS-050</span>
            <span class="availability-tag">In Stock (Demonstration Inventory)</span>
          </div>
        </div>

        <div class="product-description-container">
          <h2 class="section-title">Formulation Overview</h2>
          <p class="product-description" id="visible-description">
            A restorative botanical facial serum formulated with 2% niacinamide, ceramide complex, 
            and multi-molecular hyaluronic acid to hydrate and protect the skin barrier against environmental stressors.
          </p>

          <h2 class="section-title">Active Ingredients</h2>
          <div class="ingredients-list" id="visible-ingredients">
            <strong>Key Actives:</strong> 2% Niacinamide (Vitamin B3), Ceramide NP, Ceramide AP, Sodium Hyaluronate.<br>
            <strong>Full INCI:</strong> Aqua (Water), Glycerin, Niacinamide, Squalane, Ceramide NP, Ceramide AP, 
            Sodium Hyaluronate, Tocopherol, Xanthan Gum, Phenoxyethanol, Ethylhexylglycerin.
          </div>

          <h2 class="section-title">Formulation Specifications (Demonstration Model)</h2>
          <ul class="benefits-list" id="visible-benefits">
            <li>Formulated with humectants and ceramides for barrier hydration (demonstration specification).</li>
            <li>Provides multi-depth moisture retention with balanced humectants and emollients.</li>
            <li>Formulated without synthetic fragrance, essential oils, or artificial colorants.</li>
```

---

### Defect 2: Schema.org JSON-LD Structured Data

#### Actual Captured Baseline JSON-LD (`evidence/baseline/jsonld-extracted.json`)
```json
{
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Generic Serum",
    "description": "Skin serum"
  }
```

*Errors Detected in Baseline:*
- `Product node #1 (Block #1) is missing a valid 'sku' property.`
- `Product node #1 (Block #1) is missing mandatory commercial property 'offers'.`
- `Discrepancy: Product node #1 (Block #1) name ("Generic Serum") does not match visible title ("Radiant Barrier Defense Serum").`
- `Invalid description: Product node #1 (Block #1) description is incomplete or too short (10 characters: "Skin serum").`

#### Actual Captured Corrected JSON-LD (`evidence/fixed/jsonld-extracted.json`)
```json
{
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Radiant Barrier Defense Serum",
    "description": "A restorative botanical facial serum formulated with 2% niacinamide, ceramide complex, and multi-molecular hyaluronic acid to hydrate and protect the skin barrier against environmental stressors.",
    "sku": "AB-RDS-050",
    "brand": {
      "@type": "Brand",
      "name": "Aura Botanica"
    },
    "category": "Skincare > Facial Serums",
    "offers": {
      "@type": "Offer",
      "price": "38.00",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "url": "https://demo.aurabotanica.example/products/radiant-barrier-serum",
      "priceValidUntil": "2027-12-31"
    }
  }
```

*Validation Status in Corrected:*
- Schema.org Syntax Valid: `true`
- Visible Content Consistent: `true`
- Local Schema Validation Passed: `true`
- Official Google Rich Result Eligibility: *External manual validation required via Google Rich Results Test (not locally certified).*
- Errors: `0`

---

### Defect 3: Indexability & Canonical Directives

#### Actual Captured Baseline Directives
- Meta Robots: `["noindex, nofollow"]`
- Canonical: `["http://staging-preprod.aurabotanica.internal/products/radiant-barrier-serum"]`
- Errors:
  - `Raw HTML meta[name="robots"] contains indexing blocker: "noindex, nofollow".`
  - `Canonical URL uses insecure HTTP protocol ("http://staging-preprod.aurabotanica.internal/products/radiant-barrier-serum").`
  - `Canonical URL mismatch: expected simulated production URL "https://demo.aurabotanica.example/products/radiant-barrier-serum", found "http://staging-preprod.aurabotanica.internal/products/radiant-barrier-serum".`

#### Actual Captured Corrected Directives
- Meta Robots: `["index, follow"]`
- Canonical: `["https://demo.aurabotanica.example/products/radiant-barrier-serum"]`
- Errors: `0`

---

## Artifact Evidence Locations
- Immutable Run Directory: `evidence/runs/run-2026-11-23T10-18-48-149Z/`
- Baseline Raw HTML: `evidence/baseline/raw-html-product.html` (3696 bytes)
- Baseline Rendered DOM: `evidence/baseline/rendered-dom-product.html` (5859 bytes)
- Fixed Raw HTML: `evidence/fixed/raw-html-product.html` (6498 bytes)
- Fixed Rendered DOM: `evidence/fixed/rendered-dom-product.html` (6561 bytes)
