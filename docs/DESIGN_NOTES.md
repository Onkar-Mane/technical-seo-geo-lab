# Design Notes and Known Limits

These notes explain how the laboratory verifier works and where it stops. It is a scoped demonstration harness, not a general SEO scanner.

## What the verifier checks
For each of the two lab states (`site/baseline` and `site/fixed`) the harness fetches the product page and evaluates:

1. **Server-delivered content.** Six expected product facts (title, visible price, SKU, two active ingredients, base formulation) are searched for in the *visible text* of the raw HTML response, using a Playwright context with JavaScript disabled. Matching raw HTML source text (for example inside a script tag) does not count.
2. **Structured data (JSON-LD).** Every `<script type="application/ld+json">` block is parsed, including arrays and `@graph`. The checker requires a valid `Product` with `name`, `sku` and `offers`, and compares name, SKU, price, currency and availability against the visible page. Multiple conflicting Product blocks fail closed. Fabricated ratings or reviews are rejected.
3. **Indexability.** Meta robots and `googlebot` directives (any attribute order, any case) and the `X-Robots-Tag` header, plus the canonical link: it must be a single absolute HTTPS URL on the expected host and must not be changed or removed by JavaScript after load.
4. **Raw versus rendered.** Directives and JSON-LD are compared between the raw response and the rendered DOM, so JavaScript-injected `noindex` or schema changes are detected.

## How the verifier is itself tested
- `npm run test:negative` runs 41 deliberately broken structured-data, directive and canonical fixtures. Each must be rejected, and valid formatting variants must be accepted.
- `npm run test:mutations` applies 25 end-to-end mutations to a copy of the corrected page (for example restoring `noindex`, changing the visible price, hiding content, injecting a conflicting JSON-LD block). Each must be detected.
- `npm run test:regression` checks that failures actually reach the report: an injected failure must produce a FAIL result, not a stale PASS.
- Line endings are normalised by `.gitattributes`; a checkout forced to CRLF can produce a false FAIL, which is the safe direction.

## Evidence and provenance
Each `npm test` run writes `evidence/runs/<runId>/` with a manifest (UTC timestamp, git commit, whether the working tree was dirty, tool versions, per-stage status, test counts and SHA-256 hashes of captured files) and a comparison report. `evidence/latest-run/` is a copy of the newest run.

Behaviour on failure: normal stage failures and fatal errors inside a stage produce current FAIL evidence and a nonzero exit code. An interruption (for example killing the process), a report-write failure or a malformed stage result can leave the previous run's evidence in place; that evidence keeps its own run ID and commit.

## Known limits
- Structured-data validation covers **JSON-LD only**. Microdata and RDFa are out of scope.
- Content off-screen or hidden by unusual CSS techniques may not be classified like a real crawler would.
- Medical-claim wording is not analysed; only exact expected facts are matched.
- No real search engine, rich-results tool or AI crawler is called. A pass means "passes these local checks", not "will rank" or "will be cited".
- Only one fictional product page per state exists. The verifier has not been validated against real stores, CMS themes or large catalogs.
