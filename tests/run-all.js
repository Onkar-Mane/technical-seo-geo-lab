/**
 * Master Verification Test Suite & Orchestrator
 * 
 * Executes all evaluation suites:
 * 1. Baseline defect verification (all 3 defects detected)
 * 2. Corrected remediation verification (all 3 defects resolved)
 * 3. Structured data, visible content, and directive negative fixtures
 * 4. 16 End-to-end page mutation tests
 * 5. Regression & report integrity verification
 * 
 * Generates:
 * - Dynamic comparison matrix (no hardcoded statuses)
 * - comparison-diff.md in evidence/ and evidence/runs/<runId>/
 * - manifest.json with full run provenance, test counts, and SHA256 hashes
 * - evidence/latest-run/ labeled snapshot
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const { runBaselineTests } = require('./test-baseline');
const { runFixedTests } = require('./test-fixed');
const { runNegativeFixtureTests } = require('./test-negative-fixtures');
const { runAllMutations } = require('./test-mutations');
const { runRegressionSuite } = require('./test-regression-injected-failure');
const { generateComparisonReportMarkdown } = require('./report-generator');

function getFileSha256(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  } catch {
    return null;
  }
}

function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function main(options = {}) {
  console.log('\n###############################################################');
  console.log('   STARTING COMPLETE BEFORE-AND-AFTER VERIFICATION SUITE       ');
  console.log('###############################################################\n');

  // Read Git state BEFORE creating run directories or evidence files
  let gitCommitSha = 'unknown';
  let dirtyWorkingTree = false;
  let dirtyPaths = [];
  try {
    gitCommitSha = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    const statusOutput = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
    if (statusOutput) {
      const lines = statusOutput.split('\n').map(l => l.trim()).filter(Boolean);
      // Filter out evidence/ files so writing evidence does not self-dirty
      const nonEvidenceLines = lines.filter(l => {
        const filePath = l.replace(/^[MADRCU?!]{1,2}\s+/, '').trim();
        return !filePath.startsWith('evidence/') && !filePath.startsWith('evidence\\');
      });
      dirtyPaths = nonEvidenceLines.map(l => l.replace(/^[MADRCU?!]{1,2}\s+/, '').trim());
      dirtyWorkingTree = dirtyPaths.length > 0;
    }
  } catch (err) {
    console.warn('[MANIFEST] Git metadata check warning:', err.message);
  }

  // Timestamped run directory to preserve individual run evidence
  const runTimestamp = new Date().toISOString();
  const runId = options.runId || ('run-' + runTimestamp.replace(/[:.]/g, '-'));
  const baseEvidenceDir = options.evidenceDir || path.resolve(__dirname, '../evidence');
  const runDir = path.join(baseEvidenceDir, `runs/${runId}`);
  fs.mkdirSync(runDir, { recursive: true });

  console.log(`[RUN ID] ${runId}`);
  console.log(`[IMMUTABLE RUN EVIDENCE PATH] evidence/runs/${runId}/\n`);

  let baselineResult = null;
  let fixedResult = null;
  let negativeResult = null;
  let mutationResult = null;
  let regressionPassed = null;
  let fatalError = null;

  const stageStatus = {
    baseline: 'PENDING',
    fixed: 'PENDING',
    negativeFixtures: 'PENDING',
    pageMutations: 'PENDING',
    regressionSuite: 'PENDING'
  };

  // Stage 1A: Baseline test execution
  try {
    if (options.injectedFatalError && options.injectedFatalError.stage === 'baseline') {
      throw options.injectedFatalError.error || new Error(options.injectedFatalError.message);
    }
    stageStatus.baseline = 'RUNNING';
    baselineResult = options.baselineResultOverride || await runBaselineTests(runDir);
    stageStatus.baseline = 'COMPLETED';
  } catch (err) {
    fatalError = { stage: 'baseline', message: err.message, stack: err.stack };
    stageStatus.baseline = 'FATAL_ERROR';
    console.error('\n[FATAL ERROR in baseline stage]:', err.message);
  }

  // Stage 1B: Fixed test execution
  if (!fatalError) {
    try {
      if (options.injectedFatalError && options.injectedFatalError.stage === 'fixed') {
        throw options.injectedFatalError.error || new Error(options.injectedFatalError.message);
      }
      console.log('\n---------------------------------------------------------------\n');
      stageStatus.fixed = 'RUNNING';
      fixedResult = options.fixedResultOverride || await runFixedTests(runDir);
      stageStatus.fixed = 'COMPLETED';
    } catch (err) {
      fatalError = { stage: 'fixed', message: err.message, stack: err.stack };
      stageStatus.fixed = 'FATAL_ERROR';
      console.error('\n[FATAL ERROR in fixed stage]:', err.message);
    }
  }

  // Stage 2: Negative Fixtures
  if (!fatalError) {
    try {
      if (options.injectedFatalError && options.injectedFatalError.stage === 'negativeFixtures') {
        throw options.injectedFatalError.error || new Error(options.injectedFatalError.message);
      }
      console.log('\n---------------------------------------------------------------\n');
      stageStatus.negativeFixtures = 'RUNNING';
      negativeResult = options.negativeResultOverride || runNegativeFixtureTests();
      stageStatus.negativeFixtures = 'COMPLETED';
    } catch (err) {
      fatalError = { stage: 'negativeFixtures', message: err.message, stack: err.stack };
      stageStatus.negativeFixtures = 'FATAL_ERROR';
      console.error('\n[FATAL ERROR in negativeFixtures stage]:', err.message);
    }
  }

  // Stage 3: Page Mutation Tests
  if (!fatalError) {
    try {
      if (options.injectedFatalError && options.injectedFatalError.stage === 'pageMutations') {
        throw options.injectedFatalError.error || new Error(options.injectedFatalError.message);
      }
      console.log('\n---------------------------------------------------------------\n');
      stageStatus.pageMutations = 'RUNNING';
      mutationResult = options.mutationResultOverride || await runAllMutations();
      stageStatus.pageMutations = 'COMPLETED';
    } catch (err) {
      fatalError = { stage: 'pageMutations', message: err.message, stack: err.stack };
      stageStatus.pageMutations = 'FATAL_ERROR';
      console.error('\n[FATAL ERROR in pageMutations stage]:', err.message);
    }
  }

  // Stage 4: Regression & Report Integrity Suite
  if (!fatalError) {
    try {
      if (options.injectedFatalError && options.injectedFatalError.stage === 'regressionSuite') {
        throw options.injectedFatalError.error || new Error(options.injectedFatalError.message);
      }
      console.log('\n---------------------------------------------------------------\n');
      stageStatus.regressionSuite = 'RUNNING';
      regressionPassed = options.regressionPassedOverride !== undefined ? options.regressionPassedOverride : await runRegressionSuite();
      stageStatus.regressionSuite = 'COMPLETED';
    } catch (err) {
      fatalError = { stage: 'regressionSuite', message: err.message, stack: err.stack };
      stageStatus.regressionSuite = 'FATAL_ERROR';
      console.error('\n[FATAL ERROR in regressionSuite stage]:', err.message);
    }
  }

  // Mark all remaining PENDING stages as NOT_EXECUTED
  for (const [stage, status] of Object.entries(stageStatus)) {
    if (status === 'PENDING') {
      stageStatus[stage] = 'NOT_EXECUTED';
    }
  }

  console.log('\n###############################################################');
  console.log('          BEFORE-AND-AFTER TEST COMPARISON MATRIX             ');
  console.log('###############################################################\n');

  // Dynamically compute outcomes
  const d1BaselineFailed = Boolean(baselineResult && baselineResult.res1 && !baselineResult.res1.pass);
  const d1FixedPassed = Boolean(fixedResult && fixedResult.res1 && fixedResult.res1.pass);
  const d1Outcome = (baselineResult && fixedResult) ? ((d1BaselineFailed && d1FixedPassed) ? 'RESOLVED' : 'UNRESOLVED') : 'UNRESOLVED';

  const d2BaselineFailed = Boolean(baselineResult && baselineResult.res2 && !baselineResult.res2.pass);
  const d2FixedPassed = Boolean(fixedResult && fixedResult.res2 && fixedResult.res2.pass);
  const d2Outcome = (baselineResult && fixedResult) ? ((d2BaselineFailed && d2FixedPassed) ? 'RESOLVED' : 'UNRESOLVED') : 'UNRESOLVED';

  const d3BaselineFailed = Boolean(baselineResult && baselineResult.res3 && !baselineResult.res3.pass);
  const d3FixedPassed = Boolean(fixedResult && fixedResult.res3 && fixedResult.res3.pass);
  const d3Outcome = (baselineResult && fixedResult) ? ((d3BaselineFailed && d3FixedPassed) ? 'RESOLVED' : 'UNRESOLVED') : 'UNRESOLVED';

  const allPassed = Boolean(
    !fatalError &&
    d1Outcome === 'RESOLVED' &&
    d2Outcome === 'RESOLVED' &&
    d3Outcome === 'RESOLVED' &&
    negativeResult && negativeResult.allPassed &&
    mutationResult && mutationResult.allPassed &&
    regressionPassed === true
  );

  const matrix = [
    {
      defect: 'Defect 1: Raw HTML Product Information',
      baselineState: baselineResult && baselineResult.res1
        ? `${baselineResult.res1.status} (Raw Visible Coverage: ${baselineResult.res1.rawCoveragePercent}%, Missing: ${baselineResult.res1.rawMissingFacts.length} facts)`
        : 'NOT EXECUTED',
      fixedState: fixedResult && fixedResult.res1
        ? `${fixedResult.res1.status} (Raw Visible Coverage: ${fixedResult.res1.rawCoveragePercent}%, Parity: ${fixedResult.res1.rawCoveragePercent === 100 ? '100%' : 'Incomplete'})`
        : 'NOT EXECUTED',
      outcome: d1Outcome
    },
    {
      defect: 'Defect 2: Schema.org Product Structured Data',
      baselineState: baselineResult && baselineResult.res2
        ? `${baselineResult.res2.status} (${baselineResult.res2.errors.length} validation errors)`
        : 'NOT EXECUTED',
      fixedState: fixedResult && fixedResult.res2
        ? `${fixedResult.res2.status} (${fixedResult.res2.errors.length} validation errors, exact DOM sync, non-fabricated)`
        : 'NOT EXECUTED',
      outcome: d2Outcome
    },
    {
      defect: 'Defect 3: Canonical & Robots Indexability',
      baselineState: baselineResult && baselineResult.res3
        ? `${baselineResult.res3.status} (Robots: ${JSON.stringify(baselineResult.res3.rawRobotsList)}, Canonical: ${JSON.stringify(baselineResult.res3.rawCanonicalList)})`
        : 'NOT EXECUTED',
      fixedState: fixedResult && fixedResult.res3
        ? `${fixedResult.res3.status} (Robots: ${JSON.stringify(fixedResult.res3.rawRobotsList)}, Canonical: ${JSON.stringify(fixedResult.res3.rawCanonicalList)})`
        : 'NOT EXECUTED',
      outcome: d3Outcome
    },
    {
      defect: 'Negative Fixtures Suite',
      baselineState: 'N/A',
      fixedState: negativeResult
        ? `${negativeResult.passedFixtures}/${negativeResult.totalFixtures} correctly evaluated`
        : 'NOT EXECUTED',
      outcome: negativeResult ? (negativeResult.allPassed ? 'PASS' : 'FAIL') : 'NOT RUN'
    },
    {
      defect: 'Page Mutation Suite',
      baselineState: 'N/A',
      fixedState: mutationResult
        ? `${mutationResult.passedMutations}/${mutationResult.totalMutations} correctly rejected`
        : (fatalError && fatalError.stage === 'pageMutations' ? `FATAL ERROR: ${fatalError.message}` : 'NOT EXECUTED'),
      outcome: mutationResult ? (mutationResult.allPassed ? 'PASS' : 'FAIL') : 'FAIL'
    },
    {
      defect: 'Regression & Report Integrity Suite',
      baselineState: 'N/A',
      fixedState: regressionPassed === true
        ? 'Injected noindex + Injected report failure verified'
        : (regressionPassed === false ? 'Regression failure' : 'NOT EXECUTED'),
      outcome: regressionPassed === true ? 'PASS' : (regressionPassed === false ? 'FAIL' : 'NOT RUN')
    }
  ];

  console.table(matrix);

  // Generate comparison-diff.md dynamically
  const diffMarkdown = generateComparisonReportMarkdown({
    runId,
    runTimestamp,
    baselineResult,
    fixedResult,
    negativeResult,
    mutationResult,
    regressionPassed,
    fatalError,
    stageStatus,
    evidenceDir: baseEvidenceDir
  });

  const comparisonDiffPath = path.join(baseEvidenceDir, 'comparison-diff.md');
  const runDiffPath = path.join(runDir, 'comparison-diff.md');
  fs.writeFileSync(comparisonDiffPath, diffMarkdown, 'utf8');
  fs.writeFileSync(runDiffPath, diffMarkdown, 'utf8');
  console.log(`[EVIDENCE] Written comparison diff to evidence/comparison-diff.md and evidence/runs/${runId}/comparison-diff.md\n`);

  let playwrightVersion = 'unknown';
  try {
    const pwPkg = require('playwright/package.json');
    playwrightVersion = pwPkg.version;
  } catch {}

  const baselineRawHtml = path.join(baseEvidenceDir, 'baseline/raw-html-product.html');
  const baselineRenderedDom = path.join(baseEvidenceDir, 'baseline/rendered-dom-product.html');
  const baselineJsonLd = path.join(baseEvidenceDir, 'baseline/jsonld-extracted.json');

  const fixedRawHtml = path.join(baseEvidenceDir, 'fixed/raw-html-product.html');
  const fixedRenderedDom = path.join(baseEvidenceDir, 'fixed/rendered-dom-product.html');
  const fixedJsonLd = path.join(baseEvidenceDir, 'fixed/jsonld-extracted.json');

  const evidenceHashes = {
    'baseline/raw-html-product.html': getFileSha256(baselineRawHtml),
    'baseline/rendered-dom-product.html': getFileSha256(baselineRenderedDom),
    'baseline/jsonld-extracted.json': getFileSha256(baselineJsonLd),
    'fixed/raw-html-product.html': getFileSha256(fixedRawHtml),
    'fixed/rendered-dom-product.html': getFileSha256(fixedRenderedDom),
    'fixed/jsonld-extracted.json': getFileSha256(fixedJsonLd),
    'comparison-diff.md': getFileSha256(comparisonDiffPath)
  };

  const failures = [];
  if (fatalError) {
    failures.push(`Fatal error in stage "${fatalError.stage}": ${fatalError.message}`);
  }
  if (!baselineResult) {
    failures.push('Baseline suite was not executed');
  } else {
    if (!d1BaselineFailed) failures.push('Defect 1 was not detected in baseline');
    if (!d2BaselineFailed) failures.push('Defect 2 was not detected in baseline');
    if (!d3BaselineFailed) failures.push('Defect 3 was not detected in baseline');
  }
  if (!fixedResult) {
    failures.push('Fixed suite was not executed');
  } else {
    if (!d1FixedPassed) failures.push('Defect 1 unresolved on corrected page');
    if (!d2FixedPassed) failures.push('Defect 2 unresolved on corrected page');
    if (!d3FixedPassed) failures.push('Defect 3 unresolved on corrected page');
  }
  if (!negativeResult) {
    failures.push('Negative fixtures suite was not executed');
  } else if (!negativeResult.allPassed) {
    const failedList = (negativeResult.results || []).filter(r => !r.rejectedAsExpected).map(r => r.id);
    failures.push(`Negative fixtures failed: ${failedList.join(', ')}`);
  }
  if (!mutationResult) {
    failures.push('Page mutations suite was not executed or encountered a fatal error');
  } else if (!mutationResult.allPassed) {
    const failedList = (mutationResult.results || []).filter(r => !r.passed).map(r => r.id);
    failures.push(`Page mutations failed: ${failedList.join(', ')}`);
  }
  if (regressionPassed === null) {
    failures.push('Regression suite was not executed');
  } else if (!regressionPassed) {
    failures.push('Regression & report integrity test failed');
  }

  const baselineDetectedCount = [
    baselineResult && baselineResult.res1 && !baselineResult.res1.pass,
    baselineResult && baselineResult.res2 && !baselineResult.res2.pass,
    baselineResult && baselineResult.res3 && !baselineResult.res3.pass
  ].filter(Boolean).length;

  const fixedResolvedCount = [
    fixedResult && fixedResult.res1 && fixedResult.res1.pass,
    fixedResult && fixedResult.res2 && fixedResult.res2.pass,
    fixedResult && fixedResult.res3 && fixedResult.res3.pass
  ].filter(Boolean).length;

  const manifest = {
    runId,
    timestamp: runTimestamp,
    gitCommitSha,
    dirtyWorkingTree,
    dirtyPaths,
    toolVersions: {
      node: process.versions.node,
      playwright: playwrightVersion,
      v8: process.versions.v8,
      platform: process.platform,
      arch: process.arch
    },
    stages: stageStatus,
    fatalError: fatalError ? { stage: fatalError.stage, message: fatalError.message } : null,
    testCounts: {
      baseline: {
        executed: Boolean(baselineResult),
        defectsDetected: baselineDetectedCount,
        total: 3,
        defect1Detected: Boolean(baselineResult && baselineResult.res1 && !baselineResult.res1.pass),
        defect2Detected: Boolean(baselineResult && baselineResult.res2 && !baselineResult.res2.pass),
        defect3Detected: Boolean(baselineResult && baselineResult.res3 && !baselineResult.res3.pass)
      },
      fixed: {
        executed: Boolean(fixedResult),
        defectsResolved: fixedResolvedCount,
        total: 3,
        defect1Resolved: Boolean(fixedResult && fixedResult.res1 && fixedResult.res1.pass),
        defect2Resolved: Boolean(fixedResult && fixedResult.res2 && fixedResult.res2.pass),
        defect3Resolved: Boolean(fixedResult && fixedResult.res3 && fixedResult.res3.pass)
      },
      negativeFixtures: {
        executed: Boolean(negativeResult),
        passed: negativeResult ? negativeResult.passedFixtures : 0,
        failed: negativeResult ? negativeResult.failedFixtures : 0,
        total: negativeResult ? negativeResult.totalFixtures : 0
      },
      pageMutations: {
        executed: Boolean(mutationResult),
        passed: mutationResult ? mutationResult.passedMutations : 0,
        failed: mutationResult ? mutationResult.failedMutations : 0,
        total: mutationResult ? mutationResult.totalMutations : 0
      },
      regressionSuite: {
        executed: regressionPassed !== null,
        passed: Boolean(regressionPassed)
      }
    },
    evidenceHashes,
    overallOutcome: allPassed ? 'PASS' : 'FAIL',
    failures
  };

  const manifestPath = path.join(runDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`[MANIFEST] Written run manifest to evidence/runs/${runId}/manifest.json`);

  // Maintain labeled "latest-run" directory for convenient reference
  const latestRunDir = path.join(baseEvidenceDir, 'latest-run');
  try {
    fs.rmSync(latestRunDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    copyDirRecursive(runDir, latestRunDir);
    console.log(`[EVIDENCE] Synced evidence/latest-run/ snapshot from ${runId}`);
  } catch (err) {
    console.warn('[EVIDENCE] Could not sync latest-run directory:', err.message);
    try {
      fs.mkdirSync(latestRunDir, { recursive: true });
      fs.writeFileSync(path.join(latestRunDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
      fs.writeFileSync(path.join(latestRunDir, 'comparison-diff.md'), diffMarkdown, 'utf8');
    } catch (emergencyErr) {
      console.error('[EVIDENCE] Emergency sync to latest-run failed:', emergencyErr.message);
    }
  }

  console.log('\n===============================================================');
  console.log(`OVERALL SUITE OUTCOME: ${allPassed ? 'ALL VERIFICATIONS PASSED (Exit 0)' : 'VERIFICATION FAILED (Exit 1)'}`);
  console.log('===============================================================\n');

  if (!allPassed) {
    process.exitCode = 1;
  }

  return { allPassed, runId, manifest, fatalError };
}

if (require.main === module) {
  main().catch(err => {
    console.error('Fatal execution error:', err);
    process.exit(1);
  });
}

module.exports = { main };
