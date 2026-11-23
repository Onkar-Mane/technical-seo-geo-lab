# Controlled Lab Demonstration — Three Product-Page SEO Defects

**Demonstration Type:** Controlled Technical Proof of Concept  
**Target Subject:** Aura Botanica (Fictional Skincare Brand)  
**Execution Environment:** Localhost (`127.0.0.1`), Node.js (>=20.0.0), Playwright (Headless Chromium)  

---

## Important Disclaimers & Scope Boundaries

1. **Controlled Laboratory Demonstration:** This is a controlled laboratory demonstration using a fictional skincare brand with deliberately introduced technical defects.
2. **Not Client Work:** This work was conducted in an isolated local lab environment. It is not client work, nor was it conducted on any commercial or production storefront.
3. **Intentional Defects:** All three defects evaluated in the baseline state were deliberately introduced by the development team to simulate common real-world e-commerce implementation errors.
4. **Local Technical Behavior Only:** The remediations demonstrate local technical behavior (server-delivered raw HTTP payload content, DOM rendering states with and without JavaScript execution, Schema.org syntactic and structural validity, and HTTP/meta directives).
5. **No AI Crawlers Tested:** No generative AI search engine, LLM retriever, or third-party AI web crawler was directly invoked, queried, or benchmarked.
6. **No Search Ranking or Commercial Claims:** This demonstration does not claim, prove, or measure any increase in search engine rankings, AI citations, organic impressions, click-through rates, sales, or customer conversions.
7. **No Guaranteed Rich Results:** Passing local structured-data validation checks does not certify or guarantee Google rich-result eligibility or merchant listing appearance. Official eligibility assessment remains a separate manual validation step using Google's official Rich Results Test tool.
8. **JSON-LD Scope Only:** Structured data validation is strictly scoped to Schema.org JSON-LD (`<script type="application/ld+json">`). HTML5 Microdata and RDFa formats are outside the current validation scope.

---

## 1. Objective of the Demonstration

The objective of this controlled experiment is to demonstrate whether a local test harness combining raw HTTP stream fetching, DOM inspection without JavaScript execution, and headless browser DOM rendering can deterministically:
1. Identify three specific product-page technical discoverability defects.
2. Verify isolated code remediations for each defect.
3. Guard against false-positive reporting by ensuring test failures, page mutations, and fatal errors propagate truthfully to current and latest evidence without hardcoded success statuses.

---

## 2. The Three Evaluated Defects

### Defect 1: Product Information Absent from Server-Delivered HTML (Client-Side Rendering)
- **Baseline Implementation:** The server-delivered HTML body contained only a loading placeholder (`<div id="client-product-container"><div class="loading-skeleton"><p>Loading formulation details...</p></div></div>`). All core product details—title, visible price, SKU, active ingredients (2% Niacinamide, Ceramide NP), full INCI formulation list, and usage directions—were injected post-load via client-side JavaScript (`js/product-loader.js`).
- **Remediation Applied:** The product page template was refactored into static, server-delivered HTML (`site/fixed/products/radiant-barrier-serum.html`). All product details were placed directly into the initial HTML document body so they are immediately accessible in the raw HTTP stream without requiring client-side JavaScript execution.
- **Observed Test Outcome:**
  - *Baseline:* 0 out of 6 tested product facts were present in raw HTML visible body text (0% raw visible coverage). In rendered DOM, 6 of 6 facts were present.
  - *Remediated:* 6 out of 6 tested product facts were present in raw HTML visible body text (100% raw visible coverage).

### Defect 2: Incomplete and Conflicting Product Structured Data (Schema.org JSON-LD)
- **Baseline Implementation:** The baseline `<script type="application/ld+json">` contained an invalid schema:
  - Omitted the product `sku` property.
  - Omitted the mandatory commercial `offers` block.
  - Specified a mismatched product name (`"Generic Serum"`) that conflicted with the visible `<h1>` header (`"Radiant Barrier Defense Serum"`).
  - Specified an incomplete, truncated description (`"Skin serum"`).
- **Remediation Applied:** Added a valid Schema.org `Product` JSON-LD payload with:
  - Commercial `offers` object with numeric price (`38.00`), ISO 4217 currency (`USD`), and Schema.org availability URI (`https://schema.org/InStock`).
  - Product `name`, `description`, and `sku` synchronized with visible DOM facts.
  - Deliberately excluded synthetic ratings or fake reviews (`aggregateRating` / `review`) to respect non-fabrication policies.
- **Observed Test Outcome:**
  - *Baseline:* Programmatic validator reported 4 validation errors (missing `sku`, missing `offers`, name discrepancy, and incomplete description).
  - *Remediated:* 0 validation errors. Local structured-data validation passed for the fields checked. (Note: Official Google rich-result eligibility requires manual verification via Google's Rich Results Test tool).

### Defect 3: Unintended Noindex Directive and Staging Canonical URL
- **Baseline Implementation:** The page header contained:
  - `<meta name="robots" content="noindex, nofollow">` (simulating a leaked pre-production directive).
  - `<link rel="canonical" href="http://staging-preprod.aurabotanica.internal/products/radiant-barrier-serum">` (insecure HTTP protocol and internal staging domain).
- **Remediation Applied:**
  - Updated meta robots directive to `<meta name="robots" content="index, follow">`.
  - Updated canonical link to the simulated production HTTPS URL: `<link rel="canonical" href="https://demo.aurabotanica.example/products/radiant-barrier-serum">`.
- **Observed Test Outcome:**
  - *Baseline:* Detected 3 directive errors (blocking `noindex` directive, insecure HTTP protocol, and non-production staging domain).
  - *Remediated:* 0 directive errors. Permitted indexing verified and simulated production HTTPS canonical verified.

---

## 3. Empirical Test Evidence & Counts

Verification was executed via the automated test suite on `127.0.0.1`:

| Metric / Check | Baseline Measurement | Corrected Measurement | Delta |
| :--- | :--- | :--- | :--- |
| **Raw HTML Response Size (Bytes)** | 3,696 bytes LF (3,777 CRLF) | 6,498 bytes LF (6,630 CRLF) | +2,802 bytes |
| **Rendered DOM Size (Bytes)** | 5,859 bytes | 6,561 bytes | +702 bytes |
| **Visible Body Facts in Raw HTML** | 0 of 6 facts present | 6 of 6 facts present | +6 facts (100% coverage) |
| **Visible Body Facts in Rendered DOM** | 6 of 6 facts present | 6 of 6 facts present | 0 (Parity reached) |
| **Schema.org Validation Errors** | 4 errors detected | 0 errors detected | -4 errors |
| **Meta Robots Indexing Permission** | Blocked (`noindex, nofollow`) | Permitted (`index, follow`) | Unblocked |
| **Canonical Target Scheme & Host** | Insecure HTTP / Staging host | HTTPS / Simulated production | Normalized |
| **Negative Test Fixtures Evaluated** | 41 fixtures | 41 of 41 correctly evaluated | 41 of 41 correctly evaluated (39 negative fixtures rejected, 2 positive formatting fixtures accepted) |
| **Page Mutation Tests Evaluated** | 25 end-to-end mutations | 25 of 25 correctly rejected | 25 of 25 tested page mutations detected and rejected within the automated mutation suite |
| **Regression & Integrity Verification** | Injected failures, mutations & fatal errors | Explicitly reported `FAIL` / `UNRESOLVED` | Report integrity verified across injection and fatal error scenarios; failures propagate without hardcoded success statuses |

---

## 4. Methodological Findings & Limits

1. **Accessible Visible Text Extraction:** Relying on simple string inclusion (`html.includes(...)`) or regex pattern matching produces false positives when content exists inside `<script>` blocks, HTML comments, `<svg>` elements, or `<template>` tags. Reliable content verification requires DOM-based extraction without JavaScript execution (e.g., Playwright with `javaScriptEnabled: false`) to inspect accessible visible text and detect hidden elements (`hidden`, `style="display: none;"`).
2. **Multi-Block and Conflicting Schema Auditing:** Inspecting only the first JSON-LD block or single offer allows conflicting structured data blocks to pass unnoticed. The validation harness must inspect all `application/ld+json` scripts, traverse top-level objects, arrays, and `@graph` containers, and detect conflicting entities, pricing, and availability.
3. **Structured Data Claims Distinction:** Local syntactic validity and visible text alignment do not equal official search engine eligibility. Test reports must clearly state "Local structured-data validation passed for the fields checked" and note that official rich-result certification requires external testing.
4. **No External Guarantees:** Passing local technical checks indicates that a page satisfies the specific rules and observable facts evaluated by this harness for the fields checked. It does not guarantee how any external search engine or AI system will index, rank, or interpret that page in a live web environment.
5. **Structured Data Format Scope:** This test harness specifically evaluates Schema.org structured data embedded in `<script type="application/ld+json">` blocks. In-line HTML5 Microdata (`itemscope`, `itemprop`) and RDFa annotations are not evaluated by the current validator.
6. **Reporting Lifecycle Integrity:** When test runs encounter fatal errors (such as mutation setup failures or aborted stages), unhandled runner exits must be prevented from leaving stale PASS evidence in the latest reporting location. The runner traps stage-level exceptions and marks partial run status, so normal stage failures and tested fatal mutation errors produce current FAIL evidence. Limits: an unexpected process interruption, report-write failure or malformed stage result may leave the previous run's evidence in place; it keeps its original run ID and provenance, and the failed process exits nonzero when observable.

---

## 5. Artifact Reference

- Manifest & Provenance Log: `evidence/latest-run/manifest.json`
- Baseline Evidence Log: `evidence/baseline/test-run.log`
- Corrected Evidence Log: `evidence/fixed/test-run.log`
- Comparison Matrix & Diff: `evidence/comparison-diff.md`
