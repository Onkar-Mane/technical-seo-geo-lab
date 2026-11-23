const fs = require('fs');
const path = require('path');
const { createServer } = require('../server/server');
const {
  fetchRawHttpResponse,
  fetchNoJsDom,
  fetchRenderedDom,
  extractAllJsonLdBlocks,
  evaluateDefect1,
  evaluateDefect2,
  evaluateDefect3
} = require('./harness');

const EVIDENCE_DIR = path.resolve(__dirname, '../evidence/fixed');
fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

async function runFixedTests(runDir = null) {
  console.log('===============================================================');
  console.log('       AURA BOTANICA POC — CORRECTED / FIXED TEST EXECUTION    ');
  console.log('===============================================================\n');

  const server = createServer();
  const port = 3822;
  const host = '127.0.0.1';
  await new Promise(resolve => server.listen(port, host, resolve));

  const targetUrl = `http://${host}:${port}/fixed/products/radiant-barrier-serum.html`;
  console.log(`[TEST TARGET] ${targetUrl}`);
  console.log(`[EXECUTION TIMESTAMP] ${new Date().toISOString()}\n`);

  let logs = [];
  function log(msg) {
    console.log(msg);
    logs.push(msg);
  }

  try {
    log('--- STEP 1: Fetching Raw HTTP Payload, No-JS DOM, & Browser-Rendered DOM ---');
    const rawResponse = await fetchRawHttpResponse(targetUrl);
    const rawHtml = rawResponse.rawHtml;
    const rawByteLength = rawResponse.byteLength;

    const noJsDomData = await fetchNoJsDom(targetUrl);
    const renderedDomData = await fetchRenderedDom(targetUrl);
    const visibleFacts = renderedDomData.visibleFacts;

    const jsonLdBlocks = extractAllJsonLdBlocks(rawHtml);

    // Persist fixed evidence files
    fs.writeFileSync(path.join(EVIDENCE_DIR, 'raw-html-product.html'), rawHtml, 'utf8');
    fs.writeFileSync(path.join(EVIDENCE_DIR, 'rendered-dom-product.html'), renderedDomData.renderedHtml, 'utf8');
    fs.writeFileSync(
      path.join(EVIDENCE_DIR, 'jsonld-extracted.json'),
      jsonLdBlocks.join('\n\n') || '/* No JSON-LD found */',
      'utf8'
    );

    // Also persist into runDir if specified
    if (runDir) {
      const runFixedDir = path.join(runDir, 'fixed');
      fs.mkdirSync(runFixedDir, { recursive: true });
      fs.writeFileSync(path.join(runFixedDir, 'raw-html-product.html'), rawHtml, 'utf8');
      fs.writeFileSync(path.join(runFixedDir, 'rendered-dom-product.html'), renderedDomData.renderedHtml, 'utf8');
      fs.writeFileSync(
        path.join(runFixedDir, 'jsonld-extracted.json'),
        jsonLdBlocks.join('\n\n') || '/* No JSON-LD found */',
        'utf8'
      );
    }

    log(`[EVIDENCE] Saved raw HTML (${rawByteLength} bytes) to evidence/fixed/raw-html-product.html`);
    log(`[EVIDENCE] Saved rendered DOM (${renderedDomData.byteLength} bytes) to evidence/fixed/rendered-dom-product.html`);
    log(`[EVIDENCE] Saved ${jsonLdBlocks.length} JSON-LD block(s) to evidence/fixed/jsonld-extracted.json\n`);

    // Evaluate Defect 1
    log('--- EVALUATING DEFECT 1: Server-Delivered No-JS Visible Text vs Rendered DOM ---');
    const res1 = evaluateDefect1(noJsDomData, renderedDomData);
    log(`Result: ${res1.status} (${res1.pass ? 'Defect Resolved as Expected' : 'Defect Still Present'})`);
    if (res1.isContentHidden) {
      log('  - [ERROR] Product container (#product-content) is hidden from users (display:none or hidden attribute).');
    }
    if (res1.errors && res1.errors.length > 0) {
      res1.errors.forEach(err => log(`  - [ERROR] ${err}`));
    }
    log(`Server No-JS Visible Coverage: ${res1.rawCoveragePercent}% (${res1.rawPassedCount}/${res1.totalFactsTested} observable facts present)`);
    log(`Rendered DOM Visible Coverage: ${res1.renderedCoveragePercent}% (${res1.renderedPassedCount}/${res1.totalFactsTested} observable facts present)`);
    log(`Parity Status: ${res1.rawCoveragePercent === 100 && res1.renderedCoveragePercent === 100 ? '100% parity achieved between server delivery and browser DOM.' : 'Parity not achieved.'}\n`);

    // Evaluate Defect 2
    log('--- EVALUATING DEFECT 2: Product Structured Data (Schema.org JSON-LD) ---');
    const res2 = evaluateDefect2(rawHtml, visibleFacts, renderedDomData.jsonLdBlocks);
    log(`Result: ${res2.status} (${res2.pass ? 'Defect Resolved as Expected' : 'Defect Still Present'})`);
    log(`Schema.org Syntax Valid: ${res2.schemaOrgSyntaxValid}`);
    log(`Visible Content Consistent: ${res2.visibleContentConsistent}`);
    log(`Local Schema Validation Passed: ${res2.localSchemaValidationPassed}`);
    log(`Validation Errors: ${res2.errors.length}`);
    if (res2.errors.length > 0) {
      res2.errors.forEach(err => log(`  - [ERROR] ${err}`));
    } else {
      log('  - Schema.org context and Product @type confirmed valid across all blocks.');
      log('  - Commercial offers block present with valid numeric price and ISO 4217 currency.');
      log('  - Product name, description, SKU, and price match visible DOM facts.');
      log('  - Exact description correspondence verified under documented normalization policy.');
      log('  - Complies with non-fabrication rule (no synthetic ratings or unverified reviews).');
    }
    log(`Parsed JSON-LD Blocks: ${JSON.stringify(res2.parsedBlocks, null, 2)}\n`);

    // Evaluate Defect 3
    log('--- EVALUATING DEFECT 3: Canonical & Indexability Directives ---');
    const res3 = evaluateDefect3(rawResponse, noJsDomData, renderedDomData);
    log(`Result: ${res3.status} (${res3.pass ? 'Defect Resolved as Expected' : 'Defect Still Present'})`);
    log(`Raw Robots Directives: ${JSON.stringify(res3.rawRobotsList)}`);
    log(`Raw Googlebot Directives: ${JSON.stringify(res3.rawGooglebotList)}`);
    log(`Raw Canonical URLs: ${JSON.stringify(res3.rawCanonicalList)}`);
    log(`Expected Simulated Production Canonical: "${res3.expectedCanonical}"`);
    log(`Directives Errors: ${res3.errors.length}`);
    if (res3.errors.length > 0) {
      res3.errors.forEach(err => log(`  - [ERROR] ${err}`));
    } else {
      log('  - Meta robots directive permits indexing (index, follow).');
      log('  - Authoritative HTTPS simulated production canonical tag verified.');
      log('  - Zero client-rendered DOM mutations detected.\n');
    }

    // Fixed Outcome Summary: all 3 fixes must pass
    const allDefectsResolved = (res1.pass && res2.pass && res3.pass);
    const summaryStatus = allDefectsResolved ? 'PASS (All 3 defects verified resolved)' : 'FAIL (Defects unresolved)';
    log('===============================================================');
    log(`FIXED SUITE SUMMARY: ${summaryStatus}`);
    log('===============================================================');

    fs.writeFileSync(path.join(EVIDENCE_DIR, 'test-run.log'), logs.join('\n'), 'utf8');
    if (runDir) {
      fs.writeFileSync(path.join(runDir, 'fixed', 'test-run.log'), logs.join('\n'), 'utf8');
    }

    if (!allDefectsResolved) {
      process.exitCode = 1;
    }

    return {
      res1,
      res2,
      res3,
      allDefectsResolved,
      rawByteLength,
      renderedByteLength: renderedDomData.byteLength,
      rawResponse,
      noJsDomData,
      renderedDomData
    };
  } finally {
    server.close();
  }
}

if (require.main === module) {
  runFixedTests().catch(err => {
    console.error('Fatal error during fixed test:', err);
    process.exit(1);
  });
}

module.exports = { runFixedTests };
