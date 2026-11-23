# Test Results & Technical Evidence Log (TEST_RESULTS.md)

**Project:** Aura Botanica Controlled Lab Demonstration  
**Demonstration Type:** Controlled Technical Proof of Concept  
**Execution Environment:** Windows, Node.js (>=20.0.0), Playwright (Chromium Engine), Host `127.0.0.1`  

---

## 1. Executive Summary & Verification Matrix

All test outcomes, assertions, and report descriptions are derived dynamically from executed test assertions. Status and evaluation strings in the test harness and report generator reflect actual execution results.

| Defect Identifier | Defect Classification | Baseline State Outcome | Corrected State Outcome | Net Impact |
| :--- | :--- | :--- | :--- | :--- |
| **Defect 1** | Client-Side Content Rendering (Raw HTML Omission) | ❌ **FAIL** (0% raw visible coverage, 6 of 6 observable facts missing) | ✅ **PASS** (100% raw visible coverage, 6 of 6 observable facts present) | Complete visible body content parity between raw server delivery and browser DOM |
| **Defect 2** | Structured Data Non-Compliance (Schema.org JSON-LD) | ❌ **FAIL** (4 validation errors: missing SKU, missing offers, title mismatch, truncated description) | ✅ **PASS** (0 validation errors, exact visible DOM sync) | Schema syntax valid, visible facts consistent, local schema validation passed |
| **Defect 3** | Indexability Blocker & Canonical Misconfiguration | ❌ **FAIL** (3 errors: `noindex` directive, insecure HTTP protocol, non-production staging host) | ✅ **PASS** (0 errors: `index, follow` directive & simulated production HTTPS canonical) | Simulated production indexability unblocked |

---

## 2. Defect 1: Raw HTML vs Rendered DOM Content

### 2.1 Problem Description
In the baseline state, the primary product description, pricing, SKU, full INCI ingredient list, and formulation specifications were deferred and loaded dynamically through client-side JavaScript (`js/product-loader.js`). The raw HTTP server payload delivered only a placeholder skeleton (`<div id="client-product-container"><div class="loading-skeleton">...</div></div>`).

### 2.2 Test Methodology
The test harness executed two parallel extractions:
1. **DOM Inspection with JavaScript Disabled**: Using Playwright with `javaScriptEnabled: false`, loads the server-delivered HTML, inspects `document.body.innerText`, and verifies whether product containers are hidden via `hidden` attributes or `display: none` styles.
2. **Playwright Headless Browser with JavaScript Enabled**: Waits for full DOM hydration and extracts visible body text.
3. Evaluated individually across 6 observable product facts:
   - Fact 1: `"Radiant Barrier Defense Serum"` (Product Title)
   - Fact 2: `"$38.00"` (Visible Commercial Price)
   - Fact 3: `"AB-RDS-050"` (Product SKU)
   - Fact 4: `"2% Niacinamide"` (Primary Active Ingredient)
   - Fact 5: `"Ceramide NP"` (Secondary Active Ingredient)
   - Fact 6: `"Aqua (Water)"` (INCI Base Formulation)

### 2.3 Evidence & Results

#### Baseline Evidence
- **Raw HTML Payload Size:** 3,696 bytes (Unix LF) / 3,777 bytes (Windows CRLF)
- **Rendered DOM Size:** 5,859 bytes
- **Raw Visible Body Facts Found:** 0 of 6 facts present (0% raw visible coverage)
- **Rendered DOM Visible Facts Found:** 6 of 6 facts present (100% coverage)
- **Facts Missing in Raw Visible Text:** `["Product Title", "Visible Price", "Product SKU", "Primary Active (Niacinamide)", "Secondary Active (Ceramide NP)", "INCI Formulation Base"]`
- **Result:** ❌ **FAIL**.

#### Corrected Evidence
- **Raw HTML Payload Size:** 6,498 bytes (Unix LF) / 6,630 bytes (Windows CRLF)
- **Rendered DOM Size:** 6,561 bytes
- **Raw Visible Body Facts Found:** 6 of 6 facts present (100% coverage)
- **Rendered DOM Visible Facts Found:** 6 of 6 facts present (100% coverage)
- **Facts Missing in Raw Visible Text:** None (`[]`)
- **Parity Status:** 100% server-delivered content parity.
- **Result:** ✅ **PASS**.

---

## 3. Defect 2: Schema.org Product Structured Data

### 3.1 Problem Description
In the baseline state, the `<script type="application/ld+json">` tag contained an invalid Schema.org `Product` block. It omitted required commercial properties (`offers`), lacked an ISO currency code, omitted the `sku`, and specified a mismatched product name (`"Generic Serum"`) that conflicted with the visible `<h1>` (`"Radiant Barrier Defense Serum"`).

### 3.2 Test Methodology
The programmatic validator (`tests/validator-schema.js`) parses all `application/ld+json` script blocks on the page, traversing top-level objects, arrays, and `@graph` containers. It cross-references extracted JSON-LD fields with visible DOM elements (`#visible-title`, `#visible-price`, `#visible-sku`, `#visible-description`, `.availability-tag`).

Testing is strictly scoped to Schema.org JSON-LD (`<script type="application/ld+json">`). In-line HTML5 Microdata and RDFa formats are outside the current validation scope.

The validator distinguishes:
1. `schemaOrgSyntaxValid`: Syntactic conformance to Schema.org vocabulary.
2. `visibleContentConsistent`: Exact factual alignment with observable DOM text using a documented normalization policy.
3. `localSchemaValidationPassed`: Verification of local required properties without claiming official search engine certification.

### 3.3 Evidence & Results

#### Baseline JSON-LD Extracted:
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Generic Serum",
  "description": "Skin serum"
}
```

#### Baseline Validation Outcome:
- `schemaOrgSyntaxValid`: `false`
- `visibleContentConsistent`: `false`
- `localSchemaValidationPassed`: `false`
- **Validation Errors (4 Detected):**
  1. `[ERROR]` Product node #1 (Block #1) is missing a valid 'sku' property.
  2. `[ERROR]` Product node #1 (Block #1) is missing mandatory commercial property 'offers'.
  3. `[ERROR]` Discrepancy: Product node #1 (Block #1) name ("Generic Serum") does not match visible title ("Radiant Barrier Defense Serum").
  4. `[ERROR]` Invalid description: Product node #1 (Block #1) description is incomplete or too short (10 characters: "Skin serum").
- **Result:** ❌ **FAIL**.

#### Corrected JSON-LD Extracted:
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

#### Corrected Validation Outcome:
- `schemaOrgSyntaxValid`: `true`
- `visibleContentConsistent`: `true`
- `localSchemaValidationPassed`: `true`
- Total Errors: 0
- Commercial `offers` block verified with valid numeric price (`38.00`) and ISO 4217 currency (`USD`).
- Exact normalized SKU matching (`AB-RDS-050` === `AB-RDS-050`).
- Exact name and description correspondence based on documented normalization policy.
- Fully compliant with non-fabrication restrictions (zero synthetic ratings or unverified reviews).
- *Disclaimer:* Local structured-data validation passed for the fields checked. Official Google rich-result eligibility assessment requires external verification using Google's Rich Results Test tool.
- **Result:** ✅ **PASS**.

---

## 4. Defect 3: Canonical & Indexability Directives

### 4.1 Problem Description
In the baseline state, the product page contained an unintended `<meta name="robots" content="noindex, nofollow">` tag and a canonical tag pointing to an insecure internal staging environment (`http://staging-preprod.aurabotanica.internal/products/radiant-barrier-serum`).

### 4.2 Test Methodology
Deterministic extraction and verification of:
- All `<meta name="robots">` directives (attribute-order agnostic).
- All `<meta name="googlebot">` directives (detecting `noindex` and `none`).
- `X-Robots-Tag` HTTP response headers.
- Multiple or conflicting canonical links.
- Divergence between raw HTML directives and client-rendered DOM mutations.
- Exact matching against the simulated production canonical URL (`https://demo.aurabotanica.example/products/radiant-barrier-serum`).

### 4.3 Evidence & Results

#### Baseline State:
- **Raw Robots Meta:** `["noindex, nofollow"]`
- **Raw Canonical Tag:** `["http://staging-preprod.aurabotanica.internal/products/radiant-barrier-serum"]`
- **Errors Detected (3):**
  1. `[ERROR]` Raw HTML meta[name="robots"] contains indexing blocker: "noindex, nofollow".
  2. `[ERROR]` Canonical URL uses insecure HTTP protocol ("http://staging-preprod.aurabotanica.internal/products/radiant-barrier-serum").
  3. `[ERROR]` Canonical URL mismatch: expected simulated production URL "https://demo.aurabotanica.example/products/radiant-barrier-serum", found "http://staging-preprod.aurabotanica.internal/products/radiant-barrier-serum".
- **Result:** ❌ **FAIL**.

#### Corrected State:
- **Raw Robots Meta:** `["index, follow"]`
- **Raw Canonical Tag:** `["https://demo.aurabotanica.example/products/radiant-barrier-serum"]`
- **Errors Detected:** 0
- **Validation Outcome:** Indexing permitted; simulated production canonical normalized; zero client-rendered mutations detected.
- **Result:** ✅ **PASS**.

---

## 5. Negative Fixtures, Page Mutations & Regression Suite

### 5.1 Negative Fixtures Suite Results (41 of 41 Correctly Evaluated)
- **Structured Data Negative Fixtures (18 of 18 Rejected):**
  1. `FIXTURE_1_SYNTAX_ERROR` -> Rejected (Malformed JSON syntax (unquoted key and trailing comma))
  2. `FIXTURE_2_INVALID_TYPE` -> Rejected (Invalid @type ("Thing" instead of "Product"))
  3. `FIXTURE_3_MISSING_NAME` -> Rejected (Missing product name property)
  4. `FIXTURE_4_NAME_MISMATCH` -> Rejected (Structured data name conflicts with visible H1 title)
  5. `FIXTURE_5_MISSING_OFFERS` -> Rejected (Missing mandatory commercial offers block)
  6. `FIXTURE_6_PRICE_NUMERIC_MISMATCH` -> Rejected (Price numeric value mismatch (99.00 vs visible 38.00))
  7. `FIXTURE_7_CURRENCY_MISMATCH` -> Rejected (Currency code mismatch (EUR vs visible USD))
  8. `FIXTURE_8_SKU_MISMATCH` -> Rejected (SKU normalized mismatch (AB-RDS-999 vs visible AB-RDS-050))
  9. `FIXTURE_9_FABRICATED_RATING` -> Rejected (Fabricated aggregateRating present with zero visible reviews)
  10. `FIXTURE_10_ONE_CHAR_DESCRIPTION` -> Rejected (One-character truncated description ("A"))
  11. `FIXTURE_11_UNRELATED_DESCRIPTION` -> Rejected (Completely unrelated description (Organic almond butter))
  12. `FIXTURE_12_UNSUPPORTED_DESCRIPTION_CLAIMS` -> Rejected (Description includes fabricated unsupported claims)
  13. `FIXTURE_13_SECOND_BLOCK_PRICE_CONFLICT` -> Rejected (Second Product JSON-LD block specifies conflicting price 8.00 instead of 38.00)
  14. `FIXTURE_14_SECOND_BLOCK_CURRENCY_CONFLICT` -> Rejected (Second Product JSON-LD block specifies conflicting currency EUR instead of USD)
  15. `FIXTURE_15_SECOND_BLOCK_AVAILABILITY_CONFLICT` -> Rejected (Second Product JSON-LD block specifies OutOfStock while first specifies InStock)
  16. `FIXTURE_16_SECOND_OFFER_CONFLICT` -> Rejected (Single Product with array of offers containing conflicting prices (38.00 vs 8.00))
  17. `FIXTURE_17_SECOND_BLOCK_MALFORMED` -> Rejected (Second JSON-LD block contains malformed JSON syntax)
  18. `FIXTURE_18_GRAPH_PRODUCT_CONFLICT` -> Rejected (Conflicting Product nodes inside an @graph structure)

- **Structured Data Positive Formatting Fixtures (2 of 2 Accepted):**
  1. `VALID_FORMAT_1_WHITESPACE_AND_NEWLINES` -> Accepted (Description contains newlines, carriage returns, and tabs that normalize cleanly)
  2. `VALID_FORMAT_2_CURVED_QUOTES` -> Accepted (Description contains standard typographical quote marks)

- **Raw HTML / Accessible Visible Content Negative Fixtures (7 of 7 Rejected):**
  1. `HTML_NEG_1_DATA_IN_SCRIPT_ONLY` -> Rejected (Product data exists strictly inside JavaScript variable; visible body text contains only placeholder)
  2. `HTML_NEG_2_DATA_IN_COMMENT_ONLY` -> Rejected (Product data exists strictly inside HTML comments)
  3. `HTML_NEG_3_DATA_IN_SVG_ONLY` -> Rejected (Product name exists strictly as vector text inside SVG graphic tag)
  4. `HTML_NEG_4_HIDDEN_ATTRIBUTE` -> Rejected (Product container has "hidden" attribute; content is present in HTML source but hidden from users)
  5. `HTML_NEG_5_DISPLAY_NONE` -> Rejected (Product container has style="display: none;"; content is hidden from users)
  6. `HTML_NEG_6_DATA_IN_JSONLD_ONLY` -> Rejected (Product facts appear strictly inside JSON-LD script, visible body has only placeholder)
  7. `HTML_NEG_7_DATA_IN_TEMPLATE_ONLY` -> Rejected (Product facts appear strictly inside an inert <template> element, not in accessible visible body)

- **Canonical & Indexing Negative Fixtures (14 of 14 Rejected):**
  1. `CANONICAL_NEG_1_MULTIPLE_CONFLICTING` -> Rejected (Multiple conflicting canonical tags present in raw HTML)
  2. `CANONICAL_NEG_2_RELATIVE_URL` -> Rejected (Canonical URL is relative instead of absolute)
  3. `CANONICAL_NEG_3_INSECURE_HTTP` -> Rejected (Canonical URL specifies insecure HTTP protocol)
  4. `CANONICAL_NEG_4_STAGING_HOST` -> Rejected (Canonical URL points to non-production internal staging domain)
  5. `ROBOTS_NEG_5_NOINDEX_DIRECTIVE` -> Rejected (Robots meta tag contains noindex directive)
  6. `ROBOTS_NEG_6_GOOGLEBOT_NOINDEX` -> Rejected (Googlebot-specific meta tag contains noindex (name before content))
  7. `ROBOTS_NEG_7_GOOGLEBOT_NOINDEX_REVERSED_ATTRS` -> Rejected (Googlebot-specific meta tag contains noindex with reversed attribute order (content before name))
  8. `ROBOTS_NEG_8_ROBOTS_NONE` -> Rejected (Robots meta tag contains "none" directive (which implies noindex, nofollow))
  9. `ROBOTS_NEG_9_X_ROBOTS_TAG_HEADER` -> Rejected (HTTP response header contains X-Robots-Tag: noindex)
  10. `ROBOTS_NEG_10_X_ROBOTS_TAG_GOOGLEBOT_NONE` -> Rejected (HTTP response header contains X-Robots-Tag: googlebot: none)
  11. `ROBOTS_NEG_11_CONFLICTING_DIRECTIVES` -> Rejected (Meta robots contains conflicting directives ("index, noindex"))
  12. `CANONICAL_NEG_12_DOM_MUTATION_CHANGED` -> Rejected (Client-side JavaScript mutates canonical URL in rendered DOM)
  13. `CANONICAL_NEG_13_DOM_MUTATION_REMOVED` -> Rejected (Client-side JavaScript removes canonical link element from rendered DOM)
  14. `ROBOTS_NEG_14_DOM_MUTATION_GOOGLEBOT_INSERTED` -> Rejected (Client-side JavaScript inserts googlebot noindex directive into rendered DOM)

### 5.2 25 End-to-End Page Mutation Tests (25 of 25 Detected & Rejected)
- Script: `tests/test-mutations.js`
- Each test applies an isolated mutation to the known-good fixed product template and evaluates it against the harness:
  1. `MUTATION_1_HIDDEN_ATTR` -> Correctly rejected (Add "hidden" attribute to #product-content container)
  2. `MUTATION_2_DISPLAY_NONE` -> Correctly rejected (Add style="display: none;" to #product-content container)
  3. `MUTATION_3_DATA_IN_SCRIPT_ONLY` -> Correctly rejected (Remove visible product facts and embed them strictly in <script> variables)
  4. `MUTATION_4_DATA_IN_COMMENT_ONLY` -> Correctly rejected (Wrap product details strictly inside an HTML comment so visible body text is omitted)
  5. `MUTATION_5_DATA_IN_TEMPLATE` -> Correctly rejected (Wrap product details strictly inside an inert <template> element)
  6. `MUTATION_6_SECOND_PRODUCT_PRICE_8` -> Correctly rejected (Add second JSON-LD block with conflicting price 8.00 instead of 38.00)
  7. `MUTATION_7_SECOND_PRODUCT_EUR` -> Correctly rejected (Add second JSON-LD block with conflicting currency EUR instead of USD)
  8. `MUTATION_8_SECOND_PRODUCT_OUT_OF_STOCK` -> Correctly rejected (Add second JSON-LD block specifying OutOfStock while visible text says In Stock)
  9. `MUTATION_9_CONFLICTING_OFFERS_ARRAY` -> Correctly rejected (Configure offers as an array containing conflicting prices 38.00 and 8.00)
  10. `MUTATION_10_GRAPH_CONFLICTING_PRODUCTS` -> Correctly rejected (Configure @graph structure with two Product nodes having conflicting names)
  11. `MUTATION_11_MALFORMED_SECOND_JSONLD` -> Correctly rejected (Append second JSON-LD block containing unparseable malformed JSON syntax)
  12. `MUTATION_12_DESCRIPTION_ONE_CHAR` -> Correctly rejected (Change JSON-LD description to a 1-character incomplete string ("A"))
  13. `MUTATION_13_GOOGLEBOT_NOINDEX_REVERSED` -> Correctly rejected (Inject <meta content="noindex" name="googlebot"> with reversed attribute order)
  14. `MUTATION_14_DOM_GOOGLEBOT_INSERTED` -> Correctly rejected (Inject client-side JavaScript that appends googlebot noindex into rendered DOM)
  15. `MUTATION_15_DOM_CANONICAL_REMOVED` -> Correctly rejected (Inject client-side JavaScript that removes canonical tag from rendered DOM)
  16. `MUTATION_16_DUPLICATE_CANONICAL` -> Correctly rejected (Add duplicate conflicting canonical link tag pointing to alternate URL)
  17. `MUTATION_17_VISIBLE_PRICE_REMOVED` -> Correctly rejected (Omit visible price tag from rendered DOM markup (O03))
  18. `MUTATION_18_VISIBLE_SKU_CHANGED` -> Correctly rejected (Change visible SKU tag to conflicting SKU AB-RDS-999 (O06))
  19. `MUTATION_19_GOOGLEBOT_NOINDEX` -> Correctly rejected (Inject <meta name="googlebot" content="noindex"> tag (O07))
  20. `MUTATION_20_UNQUOTED_ROBOTS_NOINDEX` -> Correctly rejected (Inject unquoted <meta name=robots content=noindex> (O09))
  21. `MUTATION_21_WEBPAGE_MAINENTITY_CONFLICT` -> Correctly rejected (Second JSON-LD block: WebPage with mainEntity Product at $8.00 OutOfStock (N02))
  22. `MUTATION_22_PRODUCT_TYPE_ARRAY_CONFLICT` -> Correctly rejected (Second JSON-LD block: "@type": ["Product"] at $8.00 (N03))
  23. `MUTATION_23_JS_INJECTED_JSONLD_CONFLICT` -> Correctly rejected (JavaScript appends conflicting $8.00 JSON-LD block after DOMContentLoaded (N04))
  24. `MUTATION_24_VISIBLE_DESC_HIDDEN_CSS` -> Correctly rejected (Visible description hidden via stylesheet class .visually-collapsed (N05))
  25. `MUTATION_25_VISIBLE_SOLD_OUT_VS_INSTOCK` -> Correctly rejected (Visible text indicates "Sold Out" while JSON-LD specifies InStock (N06))

### 5.3 Regression & Report Integrity Suite
- Script: `tests/test-regression-injected-failure.js`
- **Part 1 (Injected Defect on Corrected Page):** Injected `<meta name="robots" content="noindex, follow">` into the corrected template. Verification confirmed that the harness and summary matrix explicitly output `FAIL` and `UNRESOLVED`.
- **Part 2 (Injected Negative Fixture Failure in Report Generator):** Evaluates actual negative fixtures with one fixture check intentionally invalidated (`FIXTURE_6_PRICE_NUMERIC_MISMATCH`). Verification confirmed that the report generator outputs `VERIFICATION FAILED`, displays the exact failed count (1 failed), identifies the failed fixture ID, and produces zero contradictory success statements.
- **Part 3 (Page Defect Injections on Corrected Template):** Evaluates live server-delivered defect injections: missing visible price (Defect 1 failure, missing 'Visible Price'), hidden product content (Defect 1 failure, `isContentHidden: true`), and conflicting structured data price (Defect 2 failure).
- **Part 4 (Reporting Lifecycle & Manifest Integrity):** Verifies that normal passing runs produce a `PASS` manifest with 0 failures, broken negative fixtures produce a `FAIL` manifest identifying the failed fixture, conflicting prices produce a `FAIL` manifest, restored noindex produces current `FAIL` evidence, missing visible price produces current `FAIL` evidence, and hidden content produces current `FAIL` evidence.
- **Part 5 (Fatal Error Handling & Stale Evidence Eviction):** Evaluates runner recovery when an unexpected exception or mutation setup failure occurs (e.g. mutation cannot modify `BASE_HTML`). Confirms that the fatal error is trapped, `overallOutcome: 'FAIL'` is assigned, unexecuted stages are marked `NOT_EXECUTED`, and, for these tested stage-level failures, `evidence/latest-run/` is replaced at the end of the run with the current FAIL evidence. Not covered: an unexpected process interruption, report-write failure or malformed stage result may leave the previous run's evidence in place; it retains its original run ID and provenance, and the failed process exits nonzero when observable.
- **Part 6 (Provenance & Agreement Verification):** Verifies that the manifest records the actual Git commit SHA, unique run ID, and tool versions, and that console output, exit code, latest manifest, and comparison diff agree.

---

## 6. Automated Reproduction Commands

```bash
# Run complete verification suite (baseline, fixed, negative fixtures, 25 mutations, regression)
npm test

# Run 25 page mutation tests only
npm run test:mutations

# Run negative fixtures suite only (41 fixtures)
npm run test:negative

# Run regression & report integrity suite only (6 parts)
npm run test:regression

# Run baseline failure tests only
npm run test:baseline

# Run corrected state tests only
npm run test:fixed
```

---

## 7. Evidence Storage & Provenance

- **Run Manifest & Provenance Log:** `evidence/latest-run/manifest.json` (Includes timestamp, Git commit SHA, dirty working tree status, tool versions, test counts, SHA256 hashes of captured evidence, and overall outcome).
- **Timestamped Run Directories:** `evidence/runs/<runId>/` (Individual immutable run directories).
- **Latest State Artifacts:** `evidence/baseline/`, `evidence/fixed/`, and `evidence/comparison-diff.md`.
