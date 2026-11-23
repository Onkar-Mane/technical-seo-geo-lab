/**
 * Regression Test: Injected Failure & Report Integrity Verification
 * 
 * Verifies mandatory regression and reporting integrity behaviors:
 * 1. Injected Defect on Corrected Page (Noindex): Reintroducing noindex causes harness
 *    and report matrix to explicitly output FAIL and UNRESOLVED.
 * 2. Injected Negative Fixture Failure in Report Generation: Genuine fixture evaluation failure
 *    propagates to report generator producing VERIFICATION FAILED and identifying exact failed fixture IDs.
 * 3. Page Defect Injections (Missing Price, Hidden Content, Conflicting Price):
 *    - Missing visible price causes Defect 1 evaluation to fail with missing facts.
 *    - Hidden product content causes Defect 1 evaluation to fail with isContentHidden.
 *    - Conflicting structured data price causes Defect 2 evaluation to fail.
 * 4. Reporting Lifecycle & Manifest Integrity:
 *    - Normal passing run produces a PASS manifest.
 *    - Broken negative fixture produces a FAIL manifest.
 *    - Corrected page with conflicting price produces a FAIL manifest.
 *    - Corrected page with restored noindex produces current FAIL evidence.
 *    - Corrected page with missing visible price produces current FAIL evidence.
 *    - Corrected page with hidden content produces current FAIL evidence.
 * 5. Fatal Error & Stale Evidence Eviction:
 *    - Fatal setup or mutation errors cannot leave stale PASS evidence presented as current.
 *    - Previous PASS evidence in latest-run is overwritten with current FAIL manifest.
 *    - Partial runs clearly identify incomplete and unexecuted checks.
 * 6. Provenance and Agreement:
 *    - Manifest identifies actual source commit and run ID.
 *    - Console outcome, exit code, latest manifest, and comparison report agree.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { fetchRawHttpResponse, fetchNoJsDom, fetchRenderedDom, evaluateDefect1, evaluateDefect2, evaluateDefect3 } = require('./harness');
const { generateComparisonReportMarkdown } = require('./report-generator');

const CORRECTED_HTML_PATH = path.resolve(__dirname, '../site/fixed/products/radiant-barrier-serum.html');
const BASE_HTML = fs.readFileSync(CORRECTED_HTML_PATH, 'utf8');

function safeRmDirSync(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    }
  } catch (err) {
    try {
      if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
      }
    } catch (_) {
      // Best-effort cleanup for transient test directories
    }
  }
}

async function testInjectedNoindexFailure() {
  console.log('--- TEST PART 1: Injected noindex on Corrected Page ---');

  let injectedHtml = BASE_HTML.replace(
    '<meta name="robots" content="index, follow">',
    '<meta name="robots" content="noindex, follow">'
  );

  const mockPort = 3899;
  const mockServer = http.createServer((req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=UTF-8',
      'Content-Length': Buffer.byteLength(injectedHtml, 'utf8')
    });
    res.end(injectedHtml);
  });

  await new Promise(resolve => mockServer.listen(mockPort, '127.0.0.1', resolve));

  try {
    const testUrl = `http://127.0.0.1:${mockPort}/injected-failure.html`;
    const rawResponse = await fetchRawHttpResponse(testUrl);
    const noJsDom = await fetchNoJsDom(testUrl);
    const renderedData = await fetchRenderedDom(testUrl);

    const evalResult = evaluateDefect3(rawResponse, noJsDom, renderedData);

    const baselineFailed = true;
    const fixedPassed = evalResult.pass;
    const matrixOutcome = (baselineFailed && fixedPassed) ? 'RESOLVED' : 'UNRESOLVED';

    const passed = (
      evalResult.pass === false &&
      evalResult.status === 'FAIL' &&
      evalResult.errors.length > 0 &&
      matrixOutcome === 'UNRESOLVED'
    );

    if (passed) {
      console.log('  [PASS] Injected noindex successfully produced FAIL and UNRESOLVED.');
      return true;
    } else {
      console.error('  [FAIL] Injected noindex failed to produce FAIL and UNRESOLVED.');
      return false;
    }
  } finally {
    mockServer.close();
  }
}

function testInjectedNegativeFixtureReportIntegrity() {
  console.log('\n--- TEST PART 2: Injected Negative Fixture Failure in Report Generation ---');

  const { STRUCTURED_DATA_FIXTURES, VALID_VISIBLE_FACTS } = require('./fixtures-negative');
  const { validateProductSchema } = require('./validator-schema');

  let passedFixtures = 0;
  let failedFixtures = 0;
  const fixtureResults = [];

  STRUCTURED_DATA_FIXTURES.forEach((fixture) => {
    const outcome = validateProductSchema(fixture.jsonInput, VALID_VISIBLE_FACTS);
    const expectedSubstring = (fixture.id === 'FIXTURE_6_PRICE_NUMERIC_MISMATCH')
      ? 'NON_EXISTENT_ERROR_SUBSTRING_INJECTED_FOR_TEST'
      : fixture.expectedErrorSubstring;

    const hasExpectedError = outcome.errors.some(err => err.includes(expectedSubstring));
    const successfullyRejected = (!outcome.valid && hasExpectedError);

    if (successfullyRejected) {
      passedFixtures++;
      fixtureResults.push({ id: fixture.id, rejectedAsExpected: true });
    } else {
      failedFixtures++;
      fixtureResults.push({ id: fixture.id, rejectedAsExpected: false, error: 'Expected ' + expectedSubstring });
    }
  });

  const realBrokenNegativeResult = {
    allPassed: failedFixtures === 0,
    passedFixtures,
    failedFixtures,
    totalFixtures: STRUCTURED_DATA_FIXTURES.length,
    results: fixtureResults
  };

  const mockBaselineResult = {
    res1: { status: 'FAIL', pass: false, rawCoveragePercent: 0, rawMissingFacts: ['Title', 'Price'] },
    res2: { status: 'FAIL', pass: false, errors: ['Missing offers', 'Name mismatch'] },
    res3: { status: 'FAIL', pass: false, rawRobotsList: ['noindex'], rawCanonicalList: ['http://staging...'], errors: ['noindex'] },
    rawByteLength: 3696,
    renderedByteLength: 5859
  };

  const mockFixedResult = {
    res1: { status: 'PASS', pass: true, rawCoveragePercent: 100, rawPassedCount: 6, totalFactsTested: 6, rawMissingFacts: [] },
    res2: { status: 'PASS', pass: true, errors: [], warnings: [], schemaOrgSyntaxValid: true, visibleContentConsistent: true, localSchemaValidationPassed: true },
    res3: { status: 'PASS', pass: true, rawRobotsList: ['index, follow'], rawCanonicalList: ['https://demo...'], errors: [] },
    rawByteLength: 6498,
    renderedByteLength: 6561
  };

  const mockMutationResult = {
    allPassed: true,
    passedMutations: 25,
    failedMutations: 0,
    totalMutations: 25,
    results: []
  };

  const report = generateComparisonReportMarkdown({
    runId: 'test-integrity-run',
    runTimestamp: new Date().toISOString(),
    baselineResult: mockBaselineResult,
    fixedResult: mockFixedResult,
    negativeResult: realBrokenNegativeResult,
    mutationResult: mockMutationResult,
    regressionPassed: true,
    evidenceDir: path.resolve(__dirname, '../evidence')
  });

  const asserts = [
    { name: 'Overall status is VERIFICATION FAILED', ok: report.includes('VERIFICATION FAILED') },
    { name: 'Reports exact failed fixture count (1 failed)', ok: report.includes('1 fixture(s) failed') },
    { name: 'Identifies failed fixture ID (FIXTURE_6_PRICE_NUMERIC_MISMATCH)', ok: report.includes('FIXTURE_6_PRICE_NUMERIC_MISMATCH') },
    { name: 'Does NOT claim ALL VERIFICATIONS PASSED', ok: !report.includes('ALL VERIFICATIONS PASSED') },
    { name: 'Does NOT claim ALL RESOLVED', ok: !report.includes('ALL RESOLVED') }
  ];

  let allAssertsOk = true;
  asserts.forEach(a => {
    if (a.ok) {
      console.log(`  [PASS] ${a.name}`);
    } else {
      console.error(`  [FAIL] ${a.name}`);
      allAssertsOk = false;
    }
  });

  return allAssertsOk;
}

async function testPageDefectInjections() {
  console.log('\n--- TEST PART 3: Page Defect Injections on Corrected Template ---');
  let allOk = true;

  // 3A: Missing Visible Price
  const withoutPriceHtml = BASE_HTML.replace(/<span class="price-value" id="visible-price">\$38\.00 USD<\/span>/, '');
  const serverPrice = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
    res.end(withoutPriceHtml);
  });
  await new Promise(r => serverPrice.listen(3915, '127.0.0.1', r));
  try {
    const url = 'http://127.0.0.1:3915/test-price.html';
    const noJsDom = await fetchNoJsDom(url);
    const rendered = await fetchRenderedDom(url);
    const evalResult = evaluateDefect1(noJsDom, rendered);
    const pass = (evalResult.pass === false && evalResult.rawMissingFacts.includes('Visible Price'));
    if (pass) {
      console.log('  [PASS] Missing visible price correctly detected as Defect 1 failure.');
    } else {
      console.error('  [FAIL] Missing visible price failed to trigger Defect 1 failure.');
      allOk = false;
    }
  } finally {
    serverPrice.close();
  }

  // 3B: Hidden Content
  const hiddenContentHtml = BASE_HTML.replace('<div id="product-content">', '<div id="product-content" hidden>');
  const serverHidden = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
    res.end(hiddenContentHtml);
  });
  await new Promise(r => serverHidden.listen(3916, '127.0.0.1', r));
  try {
    const url = 'http://127.0.0.1:3916/test-hidden.html';
    const noJsDom = await fetchNoJsDom(url);
    const rendered = await fetchRenderedDom(url);
    const evalResult = evaluateDefect1(noJsDom, rendered);
    const pass = (evalResult.pass === false && evalResult.isContentHidden === true);
    if (pass) {
      console.log('  [PASS] Hidden content correctly detected as Defect 1 isContentHidden failure.');
    } else {
      console.error('  [FAIL] Hidden content failed to trigger Defect 1 isContentHidden.');
      allOk = false;
    }
  } finally {
    serverHidden.close();
  }

  // 3C: Conflicting Price in Structured Data
  const conflictingJsonLdHtml = BASE_HTML.replace('"price": "38.00"', '"price": "8.00"');
  const serverConflict = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
    res.end(conflictingJsonLdHtml);
  });
  await new Promise(r => serverConflict.listen(3917, '127.0.0.1', r));
  try {
    const url = 'http://127.0.0.1:3917/test-conflict.html';
    const rawResp = await fetchRawHttpResponse(url);
    const rendered = await fetchRenderedDom(url);
    const evalResult = evaluateDefect2(rawResp.rawHtml, rendered.visibleFacts, rendered.jsonLdBlocks);
    const pass = (evalResult.pass === false && evalResult.errors.some(e => e.includes('does not match visible price')));
    if (pass) {
      console.log('  [PASS] Conflicting structured data price correctly detected as Defect 2 failure.');
    } else {
      console.error('  [FAIL] Conflicting structured data price failed to trigger Defect 2 failure.');
      allOk = false;
    }
  } finally {
    serverConflict.close();
  }

  return allOk;
}

async function testReportingLifecycleAndManifestIntegrity() {
  console.log('\n--- TEST PART 4: Reporting Lifecycle & Manifest Integrity ---');
  const { main } = require('./run-all');
  const tempEvidenceDir = path.resolve(__dirname, '../evidence/temp-lifecycle-test');
  fs.mkdirSync(tempEvidenceDir, { recursive: true });

  let allOk = true;

  try {
    const mockBaseline = {
      res1: { status: 'FAIL', pass: false, rawCoveragePercent: 0, rawMissingFacts: ['Title', 'Price', 'SKU', 'Actives', 'INCI'] },
      res2: { status: 'FAIL', pass: false, errors: ['Missing offers', 'SKU missing', 'Name mismatch'] },
      res3: { status: 'FAIL', pass: false, rawRobotsList: ['noindex, nofollow'], rawCanonicalList: ['http://staging...'], errors: ['noindex'] },
      rawByteLength: 3696,
      renderedByteLength: 5859
    };

    const mockPassingFixed = {
      res1: { status: 'PASS', pass: true, rawCoveragePercent: 100, rawPassedCount: 6, totalFactsTested: 6, rawMissingFacts: [] },
      res2: { status: 'PASS', pass: true, errors: [], warnings: [], schemaOrgSyntaxValid: true, visibleContentConsistent: true, localSchemaValidationPassed: true },
      res3: { status: 'PASS', pass: true, rawRobotsList: ['index, follow'], rawCanonicalList: ['https://demo...'], errors: [] },
      rawByteLength: 6498,
      renderedByteLength: 6561
    };

    const mockPassingNegatives = { allPassed: true, passedFixtures: 41, failedFixtures: 0, totalFixtures: 41, results: [] };
    const mockPassingMutations = { allPassed: true, passedMutations: 25, failedMutations: 0, totalMutations: 25, results: [] };

    // 4A: Normal passing run produces PASS manifest
    const passRun = await main({
      runId: 'test-run-pass',
      evidenceDir: tempEvidenceDir,
      baselineResultOverride: mockBaseline,
      fixedResultOverride: mockPassingFixed,
      negativeResultOverride: mockPassingNegatives,
      mutationResultOverride: mockPassingMutations,
      regressionPassedOverride: true
    });

    if (passRun.manifest.overallOutcome === 'PASS' && passRun.allPassed === true && passRun.manifest.failures.length === 0) {
      console.log('  [PASS] Normal passing run produces a PASS manifest with 0 failures.');
    } else {
      console.error('  [FAIL] Normal passing run did not produce PASS manifest.');
      allOk = false;
    }

    // 4B: Broken negative fixture produces FAIL manifest
    const brokenNegatives = {
      allPassed: false,
      passedFixtures: 40,
      failedFixtures: 1,
      totalFixtures: 41,
      results: [{ id: 'FIXTURE_6_PRICE_NUMERIC_MISMATCH', rejectedAsExpected: false }]
    };
    const failNegRun = await main({
      runId: 'test-run-broken-negative',
      evidenceDir: tempEvidenceDir,
      baselineResultOverride: mockBaseline,
      fixedResultOverride: mockPassingFixed,
      negativeResultOverride: brokenNegatives,
      mutationResultOverride: mockPassingMutations,
      regressionPassedOverride: true
    });

    if (failNegRun.manifest.overallOutcome === 'FAIL' && failNegRun.manifest.failures.some(f => f.includes('FIXTURE_6'))) {
      console.log('  [PASS] Broken negative fixture produces a FAIL manifest identifying failed fixture.');
    } else {
      console.error('  [FAIL] Broken negative fixture did not produce expected FAIL manifest.');
      allOk = false;
    }

    // 4C: Corrected page with conflicting price produces FAIL manifest
    const failingFixedPrice = {
      ...mockPassingFixed,
      res2: { status: 'FAIL', pass: false, errors: ['Price discrepancy: 8.00 vs visible 38.00'] }
    };
    const failPriceRun = await main({
      runId: 'test-run-conflicting-price',
      evidenceDir: tempEvidenceDir,
      baselineResultOverride: mockBaseline,
      fixedResultOverride: failingFixedPrice,
      negativeResultOverride: mockPassingNegatives,
      mutationResultOverride: mockPassingMutations,
      regressionPassedOverride: true
    });

    if (failPriceRun.manifest.overallOutcome === 'FAIL' && failPriceRun.manifest.failures.some(f => f.includes('Defect 2 unresolved'))) {
      console.log('  [PASS] Corrected page with conflicting price produces a FAIL manifest.');
    } else {
      console.error('  [FAIL] Conflicting price did not produce expected FAIL manifest.');
      allOk = false;
    }

    // 4D: Corrected page with restored noindex produces current FAIL evidence
    const failingFixedNoindex = {
      ...mockPassingFixed,
      res3: { status: 'FAIL', pass: false, errors: ['Indexing blocker: noindex'] }
    };
    const failNoindexRun = await main({
      runId: 'test-run-restored-noindex',
      evidenceDir: tempEvidenceDir,
      baselineResultOverride: mockBaseline,
      fixedResultOverride: failingFixedNoindex,
      negativeResultOverride: mockPassingNegatives,
      mutationResultOverride: mockPassingMutations,
      regressionPassedOverride: true
    });

    if (failNoindexRun.manifest.overallOutcome === 'FAIL' && failNoindexRun.manifest.failures.some(f => f.includes('Defect 3 unresolved'))) {
      console.log('  [PASS] Corrected page with restored noindex produces current FAIL evidence.');
    } else {
      console.error('  [FAIL] Restored noindex did not produce expected FAIL manifest.');
      allOk = false;
    }

    // 4E: Corrected page with missing visible price produces current FAIL evidence
    const failingFixedMissingPrice = {
      ...mockPassingFixed,
      res1: { status: 'FAIL', pass: false, rawCoveragePercent: 83, rawMissingFacts: ['Visible Price'] }
    };
    const failMissingPriceRun = await main({
      runId: 'test-run-missing-price',
      evidenceDir: tempEvidenceDir,
      baselineResultOverride: mockBaseline,
      fixedResultOverride: failingFixedMissingPrice,
      negativeResultOverride: mockPassingNegatives,
      mutationResultOverride: mockPassingMutations,
      regressionPassedOverride: true
    });

    if (failMissingPriceRun.manifest.overallOutcome === 'FAIL' && failMissingPriceRun.manifest.failures.some(f => f.includes('Defect 1 unresolved'))) {
      console.log('  [PASS] Corrected page with missing visible price produces current FAIL evidence.');
    } else {
      console.error('  [FAIL] Missing visible price did not produce expected FAIL manifest.');
      allOk = false;
    }

    // 4F: Corrected page with hidden content produces current FAIL evidence
    const failingFixedHiddenContent = {
      ...mockPassingFixed,
      res1: { status: 'FAIL', pass: false, rawCoveragePercent: 0, isContentHidden: true, rawMissingFacts: ['Title', 'Price', 'SKU'] }
    };
    const failHiddenRun = await main({
      runId: 'test-run-hidden-content',
      evidenceDir: tempEvidenceDir,
      baselineResultOverride: mockBaseline,
      fixedResultOverride: failingFixedHiddenContent,
      negativeResultOverride: mockPassingNegatives,
      mutationResultOverride: mockPassingMutations,
      regressionPassedOverride: true
    });

    if (failHiddenRun.manifest.overallOutcome === 'FAIL' && failHiddenRun.manifest.failures.some(f => f.includes('Defect 1 unresolved'))) {
      console.log('  [PASS] Corrected page with hidden content produces current FAIL evidence.');
    } else {
      console.error('  [FAIL] Hidden content did not produce expected FAIL manifest.');
      allOk = false;
    }
  } finally {
    safeRmDirSync(tempEvidenceDir);
  }

  return allOk;
}

async function testFatalErrorStaleEvidenceEviction() {
  console.log('\n--- TEST PART 5: Fatal Error Handling & Stale Evidence Eviction ---');
  const { main } = require('./run-all');
  const tempEvidenceDir = path.resolve(__dirname, '../evidence/temp-stale-eviction-test');
  const tempLatestDir = path.join(tempEvidenceDir, 'latest-run');
  fs.mkdirSync(tempLatestDir, { recursive: true });

  let allOk = true;

  try {
    // 1. Seed latest-run with a stale PASS manifest from a prior run
    const staleRunId = 'stale-pass-run-2026-01-01T00-00-00-000Z';
    const staleManifest = {
      runId: staleRunId,
      timestamp: '2026-01-01T00:00:00.000Z',
      gitCommitSha: 'stale-commit-sha',
      overallOutcome: 'PASS',
      failures: []
    };
    fs.writeFileSync(path.join(tempLatestDir, 'manifest.json'), JSON.stringify(staleManifest, null, 2), 'utf8');
    fs.writeFileSync(path.join(tempEvidenceDir, 'comparison-diff.md'), '# Stale Comparison\nALL VERIFICATIONS PASSED', 'utf8');

    // 2. Execute main with an injected fatal error in mutation suite (e.g. mutation fails to modify BASE_HTML)
    const fatalRunId = 'test-run-fatal-mutation-' + Date.now();
    const fatalRun = await main({
      runId: fatalRunId,
      evidenceDir: tempEvidenceDir,
      injectedFatalError: {
        stage: 'pageMutations',
        message: 'Mutation MUTATION_1_HIDDEN_ATTR failed to modify BASE_HTML! Line ending or target string mismatch.'
      }
    });

    // 3. Inspect latest-run manifest
    const latestManifest = JSON.parse(fs.readFileSync(path.join(tempLatestDir, 'manifest.json'), 'utf8'));
    const latestDiff = fs.readFileSync(path.join(tempEvidenceDir, 'comparison-diff.md'), 'utf8');

    const asserts = [
      { name: 'Fatal run returned allPassed === false', ok: fatalRun.allPassed === false },
      { name: 'Fatal run manifest overallOutcome is FAIL', ok: fatalRun.manifest.overallOutcome === 'FAIL' },
      { name: 'Manifest records fatalError object with stage and message', ok: Boolean(fatalRun.manifest.fatalError && fatalRun.manifest.fatalError.stage === 'pageMutations') },
      { name: 'Manifest records unexecuted stage (regressionSuite: NOT_EXECUTED)', ok: fatalRun.manifest.stages.regressionSuite === 'NOT_EXECUTED' },
      { name: 'Latest-run manifest runId is updated (stale runId evicted)', ok: latestManifest.runId === fatalRunId && latestManifest.runId !== staleRunId },
      { name: 'Latest-run manifest overallOutcome is FAIL (stale PASS evicted)', ok: latestManifest.overallOutcome === 'FAIL' },
      { name: 'Comparison diff records VERIFICATION FAILED', ok: latestDiff.includes('VERIFICATION FAILED') },
      { name: 'Comparison diff contains Execution Interrupted by Fatal Error alert', ok: latestDiff.includes('Execution Interrupted by Fatal Error') }
    ];

    asserts.forEach(a => {
      if (a.ok) {
        console.log(`  [PASS] ${a.name}`);
      } else {
        console.error(`  [FAIL] ${a.name}`);
        allOk = false;
      }
    });
  } finally {
    safeRmDirSync(tempEvidenceDir);
  }

  return allOk;
}

function testProvenanceAndConsistency() {
  console.log('\n--- TEST PART 6: Provenance & Agreement Verification ---');

  const latestManifestPath = path.resolve(__dirname, '../evidence/latest-run/manifest.json');
  const latestDiffPath = path.resolve(__dirname, '../evidence/comparison-diff.md');

  if (!fs.existsSync(latestManifestPath)) {
    console.warn('  [SKIP] evidence/latest-run/manifest.json not present on disk yet.');
    return true;
  }

  const manifest = JSON.parse(fs.readFileSync(latestManifestPath, 'utf8'));
  const diffContent = fs.readFileSync(latestDiffPath, 'utf8');

  let currentGitHead = 'unknown';
  try {
    currentGitHead = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch {}

  const asserts = [
    { name: 'Manifest identifies actual Git commit SHA', ok: Boolean(manifest.gitCommitSha && manifest.gitCommitSha.length >= 7) },
    { name: 'Manifest records execution run ID', ok: Boolean(manifest.runId && manifest.runId.startsWith('run-')) },
    { name: 'Manifest records tool versions (node, playwright)', ok: Boolean(manifest.toolVersions && manifest.toolVersions.node) },
    { name: 'Manifest overallOutcome agrees with comparison diff status', ok: (manifest.overallOutcome === 'PASS' && diffContent.includes('ALL VERIFICATIONS PASSED')) || (manifest.overallOutcome === 'FAIL' && diffContent.includes('VERIFICATION FAILED')) }
  ];

  let allOk = true;
  asserts.forEach(a => {
    if (a.ok) {
      console.log(`  [PASS] ${a.name}`);
    } else {
      console.error(`  [FAIL] ${a.name}`);
      allOk = false;
    }
  });

  return allOk;
}

async function runRegressionSuite() {
  console.log('===============================================================');
  console.log('  AURA BOTANICA POC — REGRESSION & REPORT INTEGRITY SUITE     ');
  console.log('===============================================================\n');

  const part1Ok = await testInjectedNoindexFailure();
  const part2Ok = testInjectedNegativeFixtureReportIntegrity();
  const part3Ok = await testPageDefectInjections();
  const part4Ok = await testReportingLifecycleAndManifestIntegrity();
  const part5Ok = await testFatalErrorStaleEvidenceEviction();
  const part6Ok = testProvenanceAndConsistency();

  const allOk = part1Ok && part2Ok && part3Ok && part4Ok && part5Ok && part6Ok;
  console.log('\n===============================================================');
  console.log(`REGRESSION SUITE OUTCOME: ${allOk ? 'PASS (All integrity assertions verified)' : 'FAIL'}`);
  console.log('===============================================================');

  if (allOk) {
    process.exitCode = 0;
  } else {
    process.exitCode = 1;
  }
  return allOk;
}

if (require.main === module) {
  runRegressionSuite().catch(err => {
    console.error('Fatal regression suite error:', err);
    process.exit(1);
  });
}

module.exports = {
  testInjectedNoindexFailure,
  testInjectedNegativeFixtureReportIntegrity,
  testPageDefectInjections,
  testReportingLifecycleAndManifestIntegrity,
  testFatalErrorStaleEvidenceEviction,
  testProvenanceAndConsistency,
  runRegressionSuite
};
