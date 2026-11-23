# Technical SEO & GEO Lab

A small, reproducible **laboratory demonstration** of three product-page technical SEO and AI-search-readiness defects, how each was fixed, and an automated harness that verifies the before and after states.

> **Please read first**
> - **Aura Botanica is a fictional brand.** All products are labeled "demonstration only, not for sale".
> - **The three defects were introduced deliberately** to simulate common implementation mistakes.
> - **This is not customer work.** No real store, client or production site was touched.
> - **No ranking improvement, traffic, sales or AI citation was measured or claimed.** No search engine or AI crawler was queried.
> - **The validator is a scoped lab tool**, not a comprehensive commercial SEO scanner. It has only been exercised on this one fictional product page.

## What it demonstrates

| # | Defect (baseline) | Fix (corrected page) | Why it matters |
|---|---|---|---|
| 1 | **Product facts missing from server HTML.** Title, price, SKU and ingredients are injected by JavaScript after load; the raw HTML holds only a loading skeleton. | The facts are rendered in the server-delivered HTML; JavaScript is progressive enhancement only. | Crawlers and retrieval systems that read raw HTML may never see the content, and rendering may be delayed. (This is a hypothesis about third-party behavior; it is not measured here.) |
| 2 | **Incomplete, inconsistent Product JSON-LD.** No `offers`, no `sku`, a name ("Generic Serum") that conflicts with the visible title, and a 10-character description. | A complete `Product` block with offer, price, currency and availability that matches the visible page. | Structured data that is missing or contradicts the visible page may stop rich results from appearing and creates conflicting signals. |
| 3 | **Indexing directives and canonical.** A `noindex, nofollow` robots meta tag and a canonical pointing at an HTTP staging host. | `index, follow` and an HTTPS production canonical. | Leftover pre-production settings can keep a page out of search results. |

Measured in the lab (see [`evidence/comparison-diff.md`](evidence/comparison-diff.md)): visible product facts in raw HTML go from 0 of 6 to 6 of 6; local structured-data errors go from 4 to 0; the indexing directive and canonical checks go from fail to pass.

## Quick start

Requirements: **Node.js 20 or newer** and npm. Developed and tested on Windows; expected to work on macOS and Linux (line endings are pinned to LF by `.gitattributes`).

```bash
npm ci
npx playwright install chromium   # one-time browser download for the test harness
npm test                          # full verification, writes evidence/
```

Browse the two states yourself:

```bash
npm start                         # serves on 127.0.0.1:3000 only
```

- Baseline: http://127.0.0.1:3000/baseline/products/radiant-barrier-serum.html
- Corrected: http://127.0.0.1:3000/fixed/products/radiant-barrier-serum.html

Individual suites:

```bash
npm run test:baseline      # the 3 defects are detected on the baseline
npm run test:fixed         # the 3 defects are resolved on the corrected page
npm run test:negative      # 41 deliberately invalid fixtures are rejected
npm run test:mutations     # 25 page mutations of the corrected page are detected
npm run test:regression    # failures reach the report; no stale PASS
```

## Evidence

- `evidence/comparison-diff.md`: before/after matrix with captured snippets.
- `evidence/baseline/`, `evidence/fixed/`: raw HTML, rendered DOM, extracted JSON-LD and logs.
- `evidence/latest-run/manifest.json`: run provenance (UTC timestamp, git commit, whether the tree was dirty, tool versions, per-stage status, SHA-256 hashes).

The committed evidence was generated from a clean checkout of the first commit (`5a52116`). `npm test` regenerates it, so your run will have its own run ID and commit.

## What the verification does and does not prove

**Does:** on this fictional page, in a local Chromium, the checks reliably distinguish the broken state from the corrected state, and they catch 41 invalid fixtures and 25 page mutations. Failures reach the report.

**Does not:**
- prove anything about Google, Bing or any AI system's behavior, rankings, citations, traffic or sales;
- certify rich-result eligibility (use Google's Rich Results Test for that);
- cover microdata or RDFa (JSON-LD only), or work on arbitrary CMS themes or large catalogs;
- replace a manual review of a real site.

More detail: [`docs/DESIGN_NOTES.md`](docs/DESIGN_NOTES.md), [`docs/CASE_STUDY.md`](docs/CASE_STUDY.md), [`docs/TEST_RESULTS.md`](docs/TEST_RESULTS.md).

## Sample documents

Illustrative PDFs produced from this lab only (clearly marked as samples about a fictional site):

- [`portfolio/sample-audit-report.pdf`](portfolio/sample-audit-report.pdf): 4-page sample audit report format.
- [`portfolio/one-page-technical-demonstration.pdf`](portfolio/one-page-technical-demonstration.pdf): one-page summary.

`portfolio/build-portfolio-pdfs.js` regenerates them (`node portfolio/build-portfolio-pdfs.js`).

## Technologies

Node.js (no framework), a zero-dependency static HTTP server, Playwright (Chromium) for rendered-DOM checks, plain HTML/CSS/JavaScript for the lab pages.

## Project layout

```
site/baseline/   the defective pages
site/fixed/      the corrected pages
server/          local static server (127.0.0.1 only)
tests/           validator, fixtures, mutation and regression suites, orchestrator
evidence/        captured evidence and run manifests
docs/            case study, test results, design notes
portfolio/       sample PDFs and their generator
```

## Limitations

See the "Known limits" section of [`docs/DESIGN_NOTES.md`](docs/DESIGN_NOTES.md). In short: one fictional page, JSON-LD only, local checks only.

## License and attribution

- **Source code and documentation:** MIT License, Copyright (c) 2026 Onkar Mane. See [`LICENSE`](LICENSE).
- **Sample PDFs in `portfolio/`:** copyright retained by Onkar Mane; you may view and share them unchanged, with the notice in [`portfolio/LICENSE.txt`](portfolio/LICENSE.txt). They are not covered by the MIT license.
- **Third-party:** [Playwright](https://playwright.dev/) (Apache-2.0) is a development dependency; see [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
- The lab pages use original text, inline SVG and CSS with system fonts; no third-party images or fonts.
