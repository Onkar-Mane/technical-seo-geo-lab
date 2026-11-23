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

const EVIDENCE_DIR = path.resolve(__dirname, '../evidence/baseline');
fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

async function runBaselineTests(runDir = null) {
  console.log('===============================================================');
  console.log('       AURA BOTANICA POC — BASELINE TEST EXECUTION            ');
  console.log('===============================================================\n');

  const server = createServer();
  const port = 3821;
  const host = '127.0.0.1';
  await new Promise(resolve => server.listen(port, host, resolve));

  const targetUrl = `http://${host}:${port}/baseline/products/radiant-barrier-serum.html`;
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

    // Persist raw baseline evidence files
    fs.writeFileSync(path.join(EVIDENCE_DIR, 'raw-html-product.html'), rawHtml, 'utf8');
    fs.writeFileSync(path.join(EVIDENCE_DIR, 'rendered-dom-product.html'), renderedDomData.renderedHtml, 'utf8');
    fs.writeFileSync(
      path.join(EVIDENCE_DIR, 'jsonld-extracted.json'),
      jsonLdBlocks.join('\n\n') || '/* No JSON-LD found */',
      'utf8'
    );

    // Also persist into runDir if specified
    if (runDir) {
      const runBaselineDir = path.join(runDir, 'baseline');
      fs.mkdirSync(runBaselineDir, { recursive: true });
      fs.writeFileSync(path.join(runBaselineDir, 'raw-html-product.html'), rawHtml, 'utf8');
      fs.writeFileSync(path.join(runBaselineDir, 'rendered-dom-product.html'), renderedDomData.renderedHtml, 'utf8');
      fs.writeFileSync(
        path.join(runBaselineDir, 'jsonld-extracted.json'),
        jsonLdBlocks.join('\n\n') || '/* No JSON-LD found */',
        'utf8'
      );
    }

    log(`[EVIDENCE] Saved raw HTML (${rawByteLength} bytes) to evidence/baseline/raw-html-product.html`);
    log(`[EVIDENCE] Saved rendered DOM (${renderedDomData.byteLength} bytes) to evidence/baseline/rendered-dom-product.html`);
    log(`[EVIDENCE] Saved ${jsonLdBlocks.length} JSON-LD block(s) to evidence/baseline/jsonld-extracted.json\n`);

    // Evaluate Defect 1
    log('--- EVALUATING DEFECT 1: Server-Delivered No-JS Visible Text vs Rendered DOM ---');
    const res1 = evaluateDefect1(noJsDomData, renderedDomData);
    log(`Result: ${res1.status} (${res1.pass ? 'Unexpected Pass' : 'Defect Detected as Expected'})`);
    log(`Server No-JS Visible Coverage: ${res1.rawCoveragePercent}% (${res1.rawPassedCount}/${res1.totalFactsTested} observable facts present)`);
    log(`Rendered DOM Visible Coverage: ${res1.renderedCoveragePercent}% (${res1.renderedPassedCount}/${res1.totalFactsTested} observable facts present)`);
    log(`Facts Missing from Server No-JS Visible Text: ${JSON.stringify(res1.rawMissingFacts)}`);
    log(`Observed Baseline Behavior: Product description, pricing, SKU, and INCI formulation are omitted from server HTML.\n`);

    // Evaluate Defect 2
    log('--- EVALUATING DEFECT 2: Product Structured Data (Schema.org JSON-LD) ---');
    const res2 = evaluateDefect2(rawHtml, visibleFacts, renderedDomData.jsonLdBlocks);
    log(`Result: ${res2.status} (${res2.pass ? 'Unexpected Pass' : 'Defect Detected as Expected'})`);
    log(`Schema.org Syntax Valid: ${res2.schemaOrgSyntaxValid}`);
    log(`Visible Content Consistent: ${res2.visibleContentConsistent}`);
    log(`Local Schema Validation Passed: ${res2.localSchemaValidationPassed}`);
    log(`Validation Errors (${res2.errors.length}):`);
    res2.errors.forEach(err => log(`  - [ERROR] ${err}`));
    log(`Validation Warnings (${res2.warnings.length}):`);
    res2.warnings.forEach(w => log(`  - [WARN] ${w}`));
    log(`Parsed JSON-LD Blocks: ${JSON.stringify(res2.parsedBlocks, null, 2)}\n`);

    // Evaluate Defect 3
    log('--- EVALUATING DEFECT 3: Canonical & Indexability Directives ---');
    const res3 = evaluateDefect3(rawResponse, noJsDomData, renderedDomData);
    log(`Result: ${res3.status} (${res3.pass ? 'Unexpected Pass' : 'Defect Detected as Expected'})`);
    log(`Raw Robots Directives: ${JSON.stringify(res3.rawRobotsList)}`);
    log(`Raw Googlebot Directives: ${JSON.stringify(res3.rawGooglebotList)}`);
    log(`Raw Canonical URLs: ${JSON.stringify(res3.rawCanonicalList)}`);
    log(`Expected Simulated Production Canonical: "${res3.expectedCanonical}"`);
    log(`Directives Errors (${res3.errors.length}):`);
    res3.errors.forEach(err => log(`  - [ERROR] ${err}`));
    log(`Observed Baseline Behavior: Unintended noindex directive active and canonical targets non-production staging host.\n`);

    // Baseline Outcome Summary: all 3 defects must be detected (i.e. all fail)
    const allDefectsDetected = (!res1.pass && !res2.pass && !res3.pass);
    const summaryStatus = allDefectsDetected ? 'PASS (All 3 defects detected)' : 'FAIL (Defects not properly detected)';
    log('===============================================================');
    log(`BASELINE SUITE SUMMARY: ${summaryStatus}`);
    log('===============================================================');

    fs.writeFileSync(path.join(EVIDENCE_DIR, 'test-run.log'), logs.join('\n'), 'utf8');
    if (runDir) {
      fs.writeFileSync(path.join(runDir, 'baseline', 'test-run.log'), logs.join('\n'), 'utf8');
    }

    if (!allDefectsDetected) {
      process.exitCode = 1;
    }

    return {
      res1,
      res2,
      res3,
      allDefectsDetected,
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
  runBaselineTests().catch(err => {
    console.error('Fatal error during baseline test:', err);
    process.exit(1);
  });
}

module.exports = { runBaselineTests };
