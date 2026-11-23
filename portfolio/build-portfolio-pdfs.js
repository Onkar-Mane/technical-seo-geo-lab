const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

async function buildPdfs() {
  const browser = await chromium.launch();
  const context = await browser.newContext();

  console.log('Building Asset A: Sample Diagnostic Report (4 pages)...');

  const sampleReportHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Sample Technical SEO & AI Readiness Audit</title>
<style>
  @page {
    size: A4;
    margin: 18mm 16mm 18mm 16mm;
  }
  
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1f2937;
    line-height: 1.45;
    font-size: 9pt;
    margin: 0;
    padding: 0;
  }

  .watermark-banner {
    background-color: #fee2e2;
    border: 1px solid #f87171;
    color: #991b1b;
    padding: 5px 10px;
    font-size: 8pt;
    font-weight: 700;
    text-align: center;
    border-radius: 4px;
    margin-bottom: 12px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  h1 { font-size: 16pt; color: #111827; margin: 0 0 4px 0; font-weight: 800; }
  h2 { font-size: 11.5pt; color: #1f2937; margin: 12px 0 5px 0; border-bottom: 1.5px solid #e5e7eb; padding-bottom: 2px; font-weight: 700; }
  h3 { font-size: 10pt; color: #374151; margin: 8px 0 3px 0; font-weight: 700; }
  p { margin: 0 0 6px 0; }
  
  .meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 5px;
    padding: 8px 10px;
    margin-bottom: 10px;
    font-size: 8pt;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 6px 0 10px 0;
    font-size: 8pt;
  }
  th, td {
    padding: 5px 7px;
    text-align: left;
    border: 1px solid #e5e7eb;
  }
  th {
    background-color: #f3f4f6;
    color: #374151;
    font-weight: 700;
  }

  .badge {
    display: inline-block;
    padding: 1.5px 5px;
    border-radius: 3px;
    font-size: 7pt;
    font-weight: 700;
    text-transform: uppercase;
  }
  .badge-critical { background: #fee2e2; color: #991b1b; }
  .badge-fact { background: #e0e7ff; color: #3730a3; }
  .badge-pass { background: #dcfce7; color: #166534; }

  .code-block {
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    padding: 6px 8px;
    font-family: "Courier New", Courier, monospace;
    font-size: 7.5pt;
    margin: 5px 0;
    white-space: pre-wrap;
    color: #0f172a;
    line-height: 1.35;
  }

  .callout {
    background: #f0fdf4;
    border-left: 3.5px solid #22c55e;
    padding: 6px 8px;
    margin: 6px 0;
    font-size: 8pt;
  }
  .callout-warning {
    background: #fffbeb;
    border-left: 3.5px solid #f59e0b;
    padding: 6px 8px;
    margin: 6px 0;
    font-size: 8pt;
  }

  .page-break {
    page-break-after: always;
  }
</style>
</head>
<body>

  <!-- PAGE 1 -->
  <div id="report-page-1">
  <div class="watermark-banner">SAMPLE — FICTIONAL CONTROLLED LAB (AURA BOTANICA DEMONSTRATION)</div>
  
  <h1>Technical SEO & AI Search Readiness Audit</h1>
  <p style="color: #4b5563; font-size: 9pt; margin-bottom: 8px;">Controlled Laboratory Diagnostic Report</p>

  <div class="meta-grid">
    <div><strong>Target Subject:</strong> Aura Botanica (Fictional Skincare Brand)</div>
    <div><strong>Audit Date:</strong> November 23, 2026</div>
    <div><strong>Stated Scope:</strong> One fictional product page evaluated in a controlled laboratory, with baseline and corrected versions.</div>
    <div><strong>Evaluator:</strong> Onkar Mane &mdash; Software Engineer | Technical SEO & AI-Assisted Website Audits</div>
  </div>

  <h2>1. Executive Summary</h2>
  <p>This technical diagnostic evaluates the search engine discoverability and Generative Engine Optimization (GEO) readiness of the <strong>Aura Botanica</strong> demonstration storefront. The evaluation inspects server response streams, browser DOM rendering behavior, server-delivered content accessibility, and Schema.org structured data in an isolated local laboratory.</p>
  
  <p><strong>Key Audit Findings:</strong> Three high-severity technical defects were identified on the baseline product detail template. While visually structured, the baseline page omits critical product specifications from initial server HTML, provides malformed structured data, and blocks indexing via a pre-production directive.</p>

  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Defect Area</th>
        <th>Classification</th>
        <th>Severity</th>
        <th>Observed Defect Impact</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>DEF-01</strong></td>
        <td>Client-Side Rendering (CSR)</td>
        <td><span class="badge badge-fact">FACT</span></td>
        <td><span class="badge badge-critical">Critical</span></td>
        <td>0 of 6 observable product facts delivered in initial server HTML body</td>
      </tr>
      <tr>
        <td><strong>DEF-02</strong></td>
        <td>Schema.org JSON-LD</td>
        <td><span class="badge badge-fact">FACT</span></td>
        <td><span class="badge badge-critical">Critical</span></td>
        <td>Missing <code>offers</code>; name discrepancy ("Generic Serum" vs visible H1)</td>
      </tr>
      <tr>
        <td><strong>DEF-03</strong></td>
        <td>Crawl Directives & Canonical</td>
        <td><span class="badge badge-fact">FACT</span></td>
        <td><span class="badge badge-critical">Critical</span></td>
        <td>Rogue <code>noindex</code> meta directive; insecure staging canonical URL</td>
      </tr>
    </tbody>
  </table>

  <h2>2. What's Working Well (Verified Baseline Observations)</h2>
  <div class="callout">
    <strong>Verified Baseline Attributes (Directly Observed in Source):</strong>
    <ul style="margin: 3px 0 0 14px; padding: 0;">
      <li><strong>Responsive Viewport Declared:</strong> The document declares <code>&lt;meta name="viewport" content="width=device-width, initial-scale=1.0"&gt;</code> in the <code>&lt;head&gt;</code>.</li>
      <li><strong>Zero Third-Party Trackers:</strong> Baseline markup is clean and free of third-party render-blocking advertising tags or tracking scripts.</li>
      <li><strong>Semantic Container Layout:</strong> Page utilizes HTML5 landmarks (<code>&lt;header&gt;</code>, <code>&lt;main&gt;</code>, <code>&lt;footer&gt;</code>).</li>
    </ul>
  </div>
  </div>

  <div class="page-break"></div>

  <!-- PAGE 2 -->
  <div id="report-page-2">
  <div class="watermark-banner">SAMPLE — FICTIONAL CONTROLLED LAB (AURA BOTANICA DEMONSTRATION)</div>

  <h2>3. Detailed Finding: Defect 1 — Raw HTML Product Content (CSR)</h2>
  <p><strong>Page URL:</strong> <code>https://demo.aurabotanica.example/products/radiant-barrier-serum.html</code><br>
  <strong>Classification:</strong> <span class="badge badge-fact">[FACT]</span> | <strong>Severity:</strong> <span class="badge badge-critical">Critical</span> | <strong>Developer Effort:</strong> Medium (2–3 hrs)</p>

  <h3>Observed Technical Evidence</h3>
  <p>Inspection of the server-delivered raw HTML stream (view-source) reveals that product specifications, ingredients, pricing, and formulation details are absent from the initial server payload. The server delivers only a skeleton loading container:</p>
  
  <div class="code-block">&lt;!-- Verbatim excerpt from site/baseline/products/radiant-barrier-serum.html --&gt;
&lt;div id="client-product-container"&gt;
  &lt;div class="loading-skeleton"&gt;
    &lt;p&gt;&lt;strong&gt;Loading formulation details and product specifications...&lt;/strong&gt;&lt;/p&gt;
    &lt;p style="font-size: 0.85rem; margin-top: 0.5rem;"&gt;
      &lt;em&gt;(Raw HTML crawler notice: Server response payload contains no product title, ingredients, clinical specifications, or pricing.)&lt;/em&gt;
    &lt;/p&gt;
  &lt;/div&gt;
&lt;/div&gt;</div>

  <p>All core facts (Title, Price $38.00, SKU AB-RDS-050, 2% Niacinamide, Ceramide NP, full INCI ingredients) are injected post-load via client-side JavaScript (<code>js/product-loader.js</code>). In raw HTML visible body text, <strong>0 of 6 facts</strong> are readable (0% raw visible coverage).</p>

  <h3>Business Relevance & Technical Impact</h3>
  <p><em>[HYPOTHESIS]</em> Search engine crawlers operate with deferred rendering queues for JavaScript execution, which may delay the indexing of updated specifications. Furthermore, lightweight AI retrieval engines frequently parse initial raw HTML payloads without executing full JavaScript single-page application hydration. Products lacking server-delivered copy risk omission in AI search summaries.</p>

  <h3>Recommended Code Remediation</h3>
  <p>Refactor the template to deliver static, semantic HTML containing the full product description and specifications directly in the initial server payload. Use JavaScript strictly for progressive UI enhancement:</p>

  <div class="code-block">&lt;!-- Verbatim excerpt from site/fixed/products/radiant-barrier-serum.html --&gt;
&lt;div id="product-content"&gt;
  &lt;div class="product-meta-header"&gt;
    &lt;div class="category-breadcrumbs"&gt;Skincare / Facial Serums&lt;/div&gt;
    &lt;h1 class="product-title" id="visible-title"&gt;Radiant Barrier Defense Serum&lt;/h1&gt;
    &lt;div class="price-row"&gt;
      &lt;span class="price-value" id="visible-price"&gt;$38.00 USD&lt;/span&gt;
      &lt;span class="sku-tag" id="visible-sku"&gt;SKU: AB-RDS-050&lt;/span&gt;
      &lt;span class="availability-tag"&gt;In Stock (Demonstration Inventory)&lt;/span&gt;
    &lt;/div&gt;
  &lt;/div&gt;
&lt;/div&gt;</div>

  <div class="callout">
    <strong>Verified Lab Outcome:</strong> In the remediated storefront (<code>site/fixed/</code>), 6 of 6 facts are present in server-delivered raw HTML visible body text (100% raw visible coverage, 100% parity with browser DOM).
  </div>
  </div>

  <div class="page-break"></div>

  <!-- PAGE 3 -->
  <div id="report-page-3">
  <div class="watermark-banner">SAMPLE — FICTIONAL CONTROLLED LAB (AURA BOTANICA DEMONSTRATION)</div>

  <h2>4. Detailed Finding: Defect 2 — Product Structured Data (Schema.org)</h2>
  <p><strong>Page URL:</strong> <code>https://demo.aurabotanica.example/products/radiant-barrier-serum.html</code><br>
  <strong>Classification:</strong> <span class="badge badge-fact">[FACT]</span> | <strong>Severity:</strong> <span class="badge badge-critical">Critical</span> | <strong>Developer Effort:</strong> Quick (1–2 hrs)</p>

  <h3>Observed Technical Evidence</h3>
  <p>The baseline JSON-LD payload injected in the page header fails local validation checks. The validator detected 4 distinct errors:</p>

  <div class="code-block">// Annotated excerpt from the fictional baseline product page
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Generic Serum",           // Discrepancy: Conflicts with visible H1 title
  "description": "Skin serum"         // Incomplete: Truncated 10-character string
  // Missing recommended product identifier 'sku'
  // Missing commercial 'offers' block
}</div>

  <h3>Business Relevance & Technical Impact</h3>
  <p><em>[HYPOTHESIS]</em> Without an <code>offers</code> block declaring price, currency, and stock availability, the page does not meet Google Search Central product rich result guidelines. Product rich results may not appear when relevant structured data is missing, invalid, or inconsistent. The name discrepancy also introduces conflicting entity signals for search engines.</p>

  <h3>Recommended Code Remediation</h3>
  <p>Replace the malformed block with complete Schema.org JSON-LD matching visible DOM facts:</p>

  <div class="code-block">&lt;!-- Verbatim excerpt from site/fixed/products/radiant-barrier-serum.html --&gt;
&lt;script type="application/ld+json"&gt;
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Radiant Barrier Defense Serum",
  "description": "A restorative botanical facial serum formulated with 2% niacinamide, ceramide complex, and multi-molecular hyaluronic acid to hydrate and protect the skin barrier against environmental stressors.",
  "sku": "AB-RDS-050",
  "brand": { "@type": "Brand", "name": "Aura Botanica" },
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
&lt;/script&gt;</div>

  <div class="callout">
    <strong>Verified Lab Outcome:</strong> Passed the specified local structured-data checks with 0 errors. Syntax valid, visible content consistent, zero fabricated ratings. (Note: Rich snippet display remains subject to Google's external quality criteria).
  </div>
  </div>

  <div class="page-break"></div>

  <!-- PAGE 4 -->
  <div id="report-page-4">
  <div class="watermark-banner">SAMPLE — FICTIONAL CONTROLLED LAB (AURA BOTANICA DEMONSTRATION)</div>

  <h2>5. Detailed Finding: Defect 3 — Directives & Canonical URL</h2>
  <p><strong>Page URL:</strong> <code>https://demo.aurabotanica.example/products/radiant-barrier-serum.html</code><br>
  <strong>Classification:</strong> <span class="badge badge-fact">[FACT]</span> | <strong>Severity:</strong> <span class="badge badge-critical">Critical</span> | <strong>Developer Effort:</strong> Quick (<1 hr)</p>

  <h3>Observed Technical Evidence</h3>
  <p>Inspection of the HTML <code>&lt;head&gt;</code> revealed two severe crawlability misconfigurations:</p>
  <div class="code-block">&lt;!-- Verbatim excerpt from site/baseline/products/radiant-barrier-serum.html --&gt;
&lt;meta name="robots" content="noindex, nofollow"&gt;
&lt;link rel="canonical" href="http://staging-preprod.aurabotanica.internal/products/radiant-barrier-serum"&gt;</div>
  <p>1. The <code>noindex</code> directive instructs search crawlers to omit the page from search indexes.<br>
  2. The canonical link uses an insecure HTTP protocol and targets an internal pre-production staging domain.</p>

  <h3>Recommended Code Remediation</h3>
  <p>Remove the blocking directive and normalize the production HTTPS canonical:</p>
  <div class="code-block">&lt;!-- Verbatim excerpt from site/fixed/products/radiant-barrier-serum.html --&gt;
&lt;meta name="robots" content="index, follow"&gt;
&lt;link rel="canonical" href="https://demo.aurabotanica.example/products/radiant-barrier-serum"&gt;</div>

  <h2>6. Scope Boundaries & Essential Disclaimers</h2>
  <div class="callout-warning">
    <strong>Mandatory Demonstration Disclaimers:</strong>
    <ul style="margin: 3px 0 0 14px; padding: 0; font-size: 8pt; line-height: 1.35;">
      <li><strong>Fictional Demonstration Brand:</strong> Aura Botanica is a fictional skincare brand created solely for controlled technical demonstration. All products are labeled DEMONSTRATION ONLY - NOT FOR SALE.</li>
      <li><strong>Deliberate Defects:</strong> All three baseline defects were intentionally introduced by engineers to simulate common real-world implementation mistakes; this is not client work.</li>
      <li><strong>Local Technical Behavior Only:</strong> This report verifies reproducible code-level facts (raw HTTP streams, DOM rendering parity, and specified local structured-data checks). It does not claim, prove, or measure search ranking increases, traffic changes, sales conversions, or third-party AI citations.</li>
      <li><strong>Official Rich Results Assessment:</strong> While the remediated template passed specified local structured-data checks, official Google rich-result appearance requires external evaluation via Google Search Central tools.</li>
    </ul>
  </div>
  </div>

</body>
</html>`;

  const page = await context.newPage();
  await page.setContent(sampleReportHtml, { waitUntil: 'load' });
  
  const samplePdfPath = path.resolve(__dirname, 'sample-audit-report.pdf');
  await page.pdf({
    path: samplePdfPath,
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: '<div style="font-size: 7.5pt; color: #6b7280; width: 100%; text-align: center; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif;">SAMPLE — FICTIONAL CONTROLLED LAB | Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
    margin: { top: '14mm', bottom: '16mm', left: '16mm', right: '16mm' }
  });
  console.log(`Saved Asset A PDF to: ${samplePdfPath}`);

  console.log('Building Asset B: One-Page Technical Demonstration...');

  const onePageHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Technical SEO & AI Search Readiness Proof of Concept</title>
<style>
  @page {
    size: A4;
    margin: 10mm 12mm 10mm 12mm;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1f2937;
    line-height: 1.35;
    font-size: 8.5pt;
    margin: 0;
    padding: 0;
  }
  .banner {
    background: #fee2e2;
    border: 1px solid #f87171;
    color: #991b1b;
    padding: 4px 8px;
    font-size: 7.5pt;
    font-weight: 800;
    text-align: center;
    border-radius: 4px;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .header-table {
    width: 100%;
    margin-bottom: 8px;
    border-bottom: 2px solid #2563eb;
    padding-bottom: 4px;
  }
  h1 { font-size: 14pt; color: #111827; margin: 0 0 2px 0; font-weight: 800; }
  .subtitle { font-size: 8pt; color: #4b5563; margin: 0; }
  
  .grid-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
    margin-bottom: 8px;
  }
  .card {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 5px;
    padding: 7px;
  }
  .card h3 {
    font-size: 9pt;
    margin: 0 0 4px 0;
    color: #1e40af;
    font-weight: 700;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 2px;
  }
  .card p { margin: 0 0 4px 0; font-size: 7.5pt; line-height: 1.3; }
  
  table.metrics {
    width: 100%;
    border-collapse: collapse;
    margin: 6px 0 8px 0;
    font-size: 7.5pt;
  }
  table.metrics th, table.metrics td {
    padding: 3.5px 5px;
    border: 1px solid #cbd5e1;
  }
  table.metrics th { background: #f1f5f9; color: #334155; font-weight: 700; }
  
  .badge {
    display: inline-block;
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 6.5pt;
    font-weight: 700;
  }
  .badge-fail { background: #fee2e2; color: #991b1b; }
  .badge-pass { background: #dcfce7; color: #166534; }

  .disclaimer-box {
    background: #f8fafc;
    border: 1px solid #94a3b8;
    border-radius: 4px;
    padding: 5px 8px;
    font-size: 7pt;
    color: #475569;
    line-height: 1.25;
  }
  .code-inline {
    font-family: monospace;
    background: #e2e8f0;
    padding: 1px 2px;
    border-radius: 2px;
    font-size: 7pt;
  }
</style>
</head>
<body>

  <div class="banner">SAMPLE — FICTIONAL CONTROLLED LAB (AURA BOTANICA DEMONSTRATION)</div>

  <table class="header-table" style="border:none;">
    <tr>
      <td style="border:none; padding:0;">
        <h1>Technical SEO & AI Search Discoverability Proof of Concept</h1>
        <p class="subtitle">Deterministic Detection, Remediation & Verification of 3 E-Commerce Product Defects</p>
      </td>
      <td style="border:none; text-align:right; font-size:7.5pt; color:#6b7280; vertical-align:bottom; padding:0;">
        <strong>Evaluator:</strong> Onkar Mane (Software Engineer | Technical SEO & AI-Assisted Website Audits)<br>
        <strong>Controlled Laboratory Demonstration</strong> | One Fictional Product Page
      </td>
    </tr>
  </table>

  <div class="grid-3">
    <!-- Defect 1 -->
    <div class="card">
      <h3>1. Server HTML Content (CSR)</h3>
      <p><strong>Problem:</strong> Core product title, price, SKU, and INCI ingredients omitted from server HTML; loaded via client-side JavaScript skeleton.</p>
      <p><strong>Remediation:</strong> Refactored to server-delivered static HTML. JavaScript restricted to progressive UI enhancement.</p>
      <p><strong>Outcome:</strong> <span class="badge badge-pass">PASS</span> Visible body facts in raw HTML increased from <strong>0/6 (0%)</strong> to <strong>6/6 (100%)</strong>.</p>
    </div>

    <!-- Defect 2 -->
    <div class="card">
      <h3>2. Structured Data (JSON-LD)</h3>
      <p><strong>Problem:</strong> Schema missing <span class="code-inline">offers</span> and recommended <span class="code-inline">sku</span>; title mismatched visible H1 ("Generic Serum"); truncated description.</p>
      <p><strong>Remediation:</strong> Deployed Schema.org <span class="code-inline">Product</span> with commercial offer synced with visible DOM facts. Zero fake reviews.</p>
      <p><strong>Outcome:</strong> <span class="badge badge-pass">PASS</span> Passed specified local structured-data checks (errors reduced from <strong>4 to 0</strong>).</p>
    </div>

    <!-- Defect 3 -->
    <div class="card">
      <h3>3. Indexability & Canonical</h3>
      <p><strong>Problem:</strong> Header contained <span class="code-inline">noindex, nofollow</span> directive and staging canonical URL (<span class="code-inline">http://staging-preprod...</span>).</p>
      <p><strong>Remediation:</strong> Removed blocking directive (<span class="code-inline">index, follow</span>) and normalized production HTTPS canonical link.</p>
      <p><strong>Outcome:</strong> <span class="badge badge-pass">PASS</span> Unblocked indexing permission verified; canonical protocol normalized.</p>
    </div>
  </div>

  <h3 style="font-size:8.5pt; margin:3px 0 2px 0; color:#111827;">Empirical Verification Matrix & Mutation Guardrails</h3>
  <table class="metrics">
    <thead>
      <tr>
        <th>Technical Check / Metric</th>
        <th>Baseline (Defective State)</th>
        <th>Remediated (Fixed State)</th>
        <th>Automated Verification Method</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Raw HTML Response Payload</strong></td>
        <td>3,696 bytes (0 of 6 facts present)</td>
        <td>6,498 bytes (6 of 6 facts present)</td>
        <td>Playwright with JavaScript disabled (<code>javaScriptEnabled: false</code>)</td>
      </tr>
      <tr>
        <td><strong>Local Structured-Data Checks</strong></td>
        <td>4 errors detected (offers, SKU, name, desc)</td>
        <td>0 errors detected (exact visible DOM sync)</td>
        <td>Multi-block & @graph JSON-LD validator against visible DOM facts</td>
      </tr>
      <tr>
        <td><strong>Meta Robots Indexing Directive</strong></td>
        <td><span class="badge badge-fail">BLOCKED</span> (noindex, nofollow)</td>
        <td><span class="badge badge-pass">PERMITTED</span> (index, follow)</td>
        <td>Attribute-order-agnostic directive parser & X-Robots-Tag audit</td>
      </tr>
      <tr>
        <td><strong>Canonical Link Scheme & Host</strong></td>
        <td>Insecure HTTP / Staging host domain</td>
        <td>Secure HTTPS / Production domain</td>
        <td>Absolute canonical link parser & protocol validator</td>
      </tr>
      <tr>
        <td><strong>Automated Negative Fixtures</strong></td>
        <td colspan="2" style="text-align:center;"><strong>41 of 41</strong> negative schema & directive fixtures correctly evaluated</td>
        <td>Automated negative fixture suite (<code>npm run test:negative</code>)</td>
      </tr>
      <tr>
        <td><strong>Automated Page Mutation Tests</strong></td>
        <td colspan="2" style="text-align:center;"><strong>25 of 25</strong> end-to-end page mutations accurately detected and rejected</td>
        <td>Automated mutation test suite (<code>npm run test:mutations</code>)</td>
      </tr>
      <tr>
        <td><strong>Reporting Lifecycle Integrity</strong></td>
        <td colspan="2" style="text-align:center;">Fatal errors & stage failures propagate truthfully without stale PASS reports</td>
        <td>6-part regression suite (<code>npm run test:regression</code>)</td>
      </tr>
    </tbody>
  </table>

  <div class="disclaimer-box">
    <strong>Controlled Demonstration Disclaimers:</strong>
    Aura Botanica is a fictional skincare brand created solely for controlled technical demonstration. All three baseline defects were intentionally introduced by developers to simulate real-world e-commerce errors; this is not client work. This demonstration proves deterministic local technical behavior (server-delivered HTML payloads, DOM rendering parity, and specified local structured-data checks). It does not claim, prove, or measure search ranking increases, traffic changes, sales conversions, or third-party AI citations. Official Google rich-result appearance requires external verification using Google Search Central tools.
  </div>

</body>
</html>`;

  const page2 = await context.newPage();
  await page2.setContent(onePageHtml, { waitUntil: 'load' });
  
  const onePagePdfPath = path.resolve(__dirname, 'one-page-technical-demonstration.pdf');
  await page2.pdf({
    path: onePagePdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '8mm', bottom: '8mm', left: '10mm', right: '10mm' }
  });
  console.log(`Saved Asset B PDF to: ${onePagePdfPath}`);

  // Visual Verification Image Rendering:
  console.log('Rendering visual verification screenshots...');
  
  // Render pages of Asset A to images
  // For Asset A, load page content and screenshot with print emulation
  await page.emulateMedia({ media: 'print' });
  await page.screenshot({ path: path.resolve(__dirname, 'sample-report-full.png'), fullPage: true });

  for (let i = 1; i <= 4; i++) {
    const el = await page.$(`#report-page-${i}`);
    if (el) {
      await el.screenshot({ path: path.resolve(__dirname, `sample-report-p${i}.png`) });
    }
  }

  // For Asset B, load and screenshot
  await page2.emulateMedia({ media: 'print' });
  await page2.screenshot({ path: path.resolve(__dirname, 'one-page-demo.png'), fullPage: true });

  await browser.close();
  console.log('PDF generation and visual capture complete!');
}

buildPdfs().catch(err => {
  console.error('Error generating PDFs:', err);
  process.exit(1);
});
