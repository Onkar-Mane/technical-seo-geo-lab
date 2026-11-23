/**
 * Dynamic Report Generator for SEO + GEO Proof-of-Concept
 * 
 * Enforces Blocker A & Blocker D:
 * - Purely dynamic derivation of all statuses (PASS, FAIL, RESOLVED, UNRESOLVED)
 * - Zero hardcoded success statements
 * - Dynamic fixture and mutation counts
 * - Never prints "0 errors" or "100% parity" unless empirically true
 * - Real snippet extraction from actual captured disk artifacts
 * - Eliminates unsupported Google rich-result claims; qualifies as local validation
 */

const fs = require('fs');
const path = require('path');

function extractSnippetFromFile(filePath, startMarker, endMarker, lineCount = 30) {
  try {
    if (!fs.existsSync(filePath)) {
      return `[File not found: ${filePath}]`;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    const startIndex = content.indexOf(startMarker);
    if (startIndex !== -1) {
      const lines = content.substring(startIndex).split('\n');
      return lines.slice(0, lineCount).join('\n').trim();
    }
    return content.split('\n').slice(0, lineCount).join('\n');
  } catch (err) {
    return `[Snippet extraction error: ${err.message}]`;
  }
}

function generateComparisonReportMarkdown(options) {
  const {
    runId = 'unknown-run',
    runTimestamp = new Date().toISOString(),
    baselineResult,
    fixedResult,
    negativeResult = { allPassed: false, passedFixtures: 0, failedFixtures: 0, totalFixtures: 0, results: [] },
    mutationResult = { allPassed: false, passedMutations: 0, failedMutations: 0, totalMutations: 0, results: [] },
    regressionPassed = false,
    fatalError = null,
    stageStatus = {},
    evidenceDir = path.resolve(__dirname, '../evidence')
  } = options;

  // Compute Defect 1 dynamic outcome
  const d1BaselineFailed = baselineResult && baselineResult.res1 && !baselineResult.res1.pass;
  const d1FixedPassed = fixedResult && fixedResult.res1 && fixedResult.res1.pass;
  const d1Outcome = (d1BaselineFailed && d1FixedPassed) ? 'RESOLVED' : 'UNRESOLVED';

  // Compute Defect 2 dynamic outcome
  const d2BaselineFailed = baselineResult && baselineResult.res2 && !baselineResult.res2.pass;
  const d2FixedPassed = fixedResult && fixedResult.res2 && fixedResult.res2.pass;
  const d2Outcome = (d2BaselineFailed && d2FixedPassed) ? 'RESOLVED' : 'UNRESOLVED';

  // Compute Defect 3 dynamic outcome
  const d3BaselineFailed = baselineResult && baselineResult.res3 && !baselineResult.res3.pass;
  const d3FixedPassed = fixedResult && fixedResult.res3 && fixedResult.res3.pass;
  const d3Outcome = (d3BaselineFailed && d3FixedPassed) ? 'RESOLVED' : 'UNRESOLVED';

  // Overall suite status
  const allResolved = (d1Outcome === 'RESOLVED' && d2Outcome === 'RESOLVED' && d3Outcome === 'RESOLVED');
  const allPassed = (
    !fatalError &&
    allResolved &&
    Boolean(negativeResult && negativeResult.allPassed) &&
    Boolean(mutationResult && mutationResult.allPassed) &&
    (regressionPassed === true)
  );

  const overallStatus = allPassed ? 'ALL VERIFICATIONS PASSED' : 'VERIFICATION FAILED';

  // Dynamic description strings for Defect 1
  const d1BaselineNote = baselineResult && baselineResult.res1
    ? (baselineResult.res1.rawMissingFacts && baselineResult.res1.rawMissingFacts.length > 0
        ? `Missing: ${baselineResult.res1.rawMissingFacts.length} facts (${baselineResult.res1.rawMissingFacts.join(', ')}). Product facts missing from server-delivered HTML.`
        : `All ${baselineResult.res1.totalFactsTested} observable facts present in server-delivered HTML.`)
    : '';
  const d1BaselineText = baselineResult && baselineResult.res1
    ? `${baselineResult.res1.status}: Raw visible body coverage ${baselineResult.res1.rawCoveragePercent}%. ${d1BaselineNote}`
    : 'Evaluation incomplete';

  const d1FixedParityText = fixedResult && fixedResult.res1
    ? (fixedResult.res1.rawCoveragePercent === 100
        ? `100% parity (${fixedResult.res1.rawPassedCount}/${fixedResult.res1.totalFactsTested} observable facts present in raw DOM)`
        : `${fixedResult.res1.rawCoveragePercent}% coverage (${fixedResult.res1.rawPassedCount}/${fixedResult.res1.totalFactsTested} present, missing: ${fixedResult.res1.rawMissingFacts.join(', ')})`)
    : 'Evaluation incomplete';

  const d1FixedText = fixedResult && fixedResult.res1
    ? `${fixedResult.res1.status}: Raw visible body coverage ${fixedResult.res1.rawCoveragePercent}%. ${d1FixedParityText}.`
    : 'Evaluation incomplete';

  // Dynamic description strings for Defect 2
  const d2BaselineErrorsCount = baselineResult && baselineResult.res2 ? baselineResult.res2.errors.length : 0;
  const d2BaselineText = baselineResult && baselineResult.res2
    ? `${baselineResult.res2.status}: ${d2BaselineErrorsCount} validation errors (${baselineResult.res2.errors.join('; ')})`
    : 'Evaluation incomplete';

  const d2FixedErrorsCount = fixedResult && fixedResult.res2 ? fixedResult.res2.errors.length : 0;
  const d2FixedText = fixedResult && fixedResult.res2
    ? (d2FixedErrorsCount === 0
        ? `${fixedResult.res2.status}: 0 errors. Local schema validation passed. Visible facts synchronized. Zero fabricated ratings.`
        : `${fixedResult.res2.status}: ${d2FixedErrorsCount} errors detected (${fixedResult.res2.errors.join('; ')})`)
    : 'Evaluation incomplete';

  // Dynamic description strings for Defect 3
  let d3BaselineNote = '';
  if (baselineResult && baselineResult.res3) {
    if (baselineResult.res3.rawCanonicalList && baselineResult.res3.rawCanonicalList.length > 0) {
      const isStaging = baselineResult.res3.rawCanonicalList.some(c => c.includes('staging'));
      if (isStaging) {
        d3BaselineNote = ' Canonical targets staging environment.';
      } else {
        d3BaselineNote = ` Canonical target: ${baselineResult.res3.rawCanonicalList.join(', ')}.`;
      }
    }
    if (baselineResult.res3.errors && baselineResult.res3.errors.length > 0) {
      d3BaselineNote += ` Errors: ${baselineResult.res3.errors.join('; ')}.`;
    }
  }
  const d3BaselineText = baselineResult && baselineResult.res3
    ? `${baselineResult.res3.status}: Active robots: ${JSON.stringify(baselineResult.res3.rawRobotsList)}, Canonical: ${JSON.stringify(baselineResult.res3.rawCanonicalList)}.${d3BaselineNote}`
    : 'Evaluation incomplete';

  const d3FixedErrorsCount = fixedResult && fixedResult.res3 ? fixedResult.res3.errors.length : 0;
  const d3FixedText = fixedResult && fixedResult.res3
    ? (d3FixedErrorsCount === 0
        ? `${fixedResult.res3.status}: ${JSON.stringify(fixedResult.res3.rawRobotsList)}. Canonical: ${JSON.stringify(fixedResult.res3.rawCanonicalList)}. Points to simulated production HTTPS canonical.`
        : `${fixedResult.res3.status}: ${d3FixedErrorsCount} errors (${fixedResult.res3.errors.join('; ')})`)
    : 'Evaluation incomplete';

  // Negative fixtures summary text
  let negativeFixturesText = '';
  if (stageStatus.negativeFixtures === 'NOT_EXECUTED') {
    negativeFixturesText = '❌ NOT EXECUTED: Negative fixture suite was not run due to prior fatal error.';
  } else if (stageStatus.negativeFixtures === 'FATAL_ERROR') {
    negativeFixturesText = `❌ FATAL ERROR: Negative fixture suite encountered a fatal error (${fatalError ? fatalError.message : 'aborted'}).`;
  } else if (negativeResult && negativeResult.allPassed) {
    negativeFixturesText = `✅ All ${negativeResult.passedFixtures}/${negativeResult.totalFixtures} structured data fixtures correctly evaluated (negative cases rejected, positive formatting accepted).`;
  } else {
    const failedList = (negativeResult && negativeResult.results ? negativeResult.results : [])
      .filter(r => !r.rejectedAsExpected)
      .map(r => r.id)
      .join(', ');
    const failedCount = negativeResult ? negativeResult.failedFixtures : 0;
    const passedCount = negativeResult ? negativeResult.passedFixtures : 0;
    const totalCount = negativeResult ? negativeResult.totalFixtures : 0;
    negativeFixturesText = `❌ ${failedCount} fixture(s) failed (${passedCount}/${totalCount} passed). Failed fixture IDs: ${failedList}`;
  }

  // Mutation summary text
  let mutationsText = '';
  if (stageStatus.pageMutations === 'NOT_EXECUTED') {
    mutationsText = '❌ NOT EXECUTED: Page mutation suite was not run due to prior fatal error.';
  } else if (stageStatus.pageMutations === 'FATAL_ERROR') {
    mutationsText = `❌ FATAL ERROR: Page mutation suite encountered a fatal error (${fatalError ? fatalError.message : 'aborted'}).`;
  } else if (mutationResult && mutationResult.allPassed) {
    mutationsText = `✅ All ${mutationResult.passedMutations}/${mutationResult.totalMutations} page mutations correctly detected and rejected.`;
  } else {
    const failedMutationsList = (mutationResult && mutationResult.results ? mutationResult.results : [])
      .filter(r => !r.passed)
      .map(r => r.id)
      .join(', ');
    const failedCount = mutationResult ? mutationResult.failedMutations : 0;
    const passedCount = mutationResult ? mutationResult.passedMutations : 0;
    const totalCount = mutationResult ? mutationResult.totalMutations : 0;
    mutationsText = `❌ ${failedCount} mutation(s) failed (${passedCount}/${totalCount} passed). Failed mutation IDs: ${failedMutationsList}`;
  }

  // Regression test text
  let regressionText = '';
  if (regressionPassed === null || stageStatus.regressionSuite === 'NOT_EXECUTED') {
    regressionText = '❌ NOT EXECUTED: Regression suite was not run due to prior fatal error.';
  } else if (stageStatus.regressionSuite === 'FATAL_ERROR') {
    regressionText = `❌ FATAL ERROR: Regression suite encountered a fatal error (${fatalError ? fatalError.message : 'aborted'}).`;
  } else if (regressionPassed === true) {
    regressionText = '✅ PASS: Injected noindex produced FAIL/UNRESOLVED; Injected negative fixture failure produced VERIFICATION FAILED.';
  } else {
    regressionText = '❌ FAIL: Regression test failed.';
  }

  // Extract actual snippets from disk
  const baselineHtmlPath = path.join(evidenceDir, 'baseline/raw-html-product.html');
  const fixedHtmlPath = path.join(evidenceDir, 'fixed/raw-html-product.html');
  const baselineJsonLdPath = path.join(evidenceDir, 'baseline/jsonld-extracted.json');
  const fixedJsonLdPath = path.join(evidenceDir, 'fixed/jsonld-extracted.json');

  const baselineSnippet = extractSnippetFromFile(baselineHtmlPath, '<div id="client-product-container">', null, 15);
  const fixedSnippet = extractSnippetFromFile(fixedHtmlPath, '<div id="product-content">', null, 30);
  const baselineJsonLd = fs.existsSync(baselineJsonLdPath) ? fs.readFileSync(baselineJsonLdPath, 'utf8') : '[Not captured]';
  const fixedJsonLd = fs.existsSync(fixedJsonLdPath) ? fs.readFileSync(fixedJsonLdPath, 'utf8') : '[Not captured]';

  const baselineBytes = baselineResult ? baselineResult.rawByteLength : 0;
  const baselineRenderedBytes = baselineResult ? baselineResult.renderedByteLength : 0;
  const fixedBytes = fixedResult ? fixedResult.rawByteLength : 0;
  const fixedRenderedBytes = fixedResult ? fixedResult.renderedByteLength : 0;

  let fatalErrorWarning = '';
  if (fatalError) {
    fatalErrorWarning = `\n> [!CAUTION]\n> **Execution Interrupted by Fatal Error:** ${fatalError.message}  \n> **Failed Stage:** \`${fatalError.stage || 'unknown'}\`  \n> The test suite encountered an unhandled exception before completing all stages. Incomplete and unexecuted checks are recorded below.\n`;
  }

  return `# Before-and-After Technical Comparison Diff

- **Execution Run ID:** \`${runId}\`
- **Execution Timestamp:** \`${runTimestamp}\`
- **Test Engine:** Node.js v${process.versions.node} + Playwright (Headless Chromium)
- **Host Binding:** \`127.0.0.1\`
- **Overall Suite Status:** \`${overallStatus}\`
${fatalErrorWarning}
## Summary Matrix

| Defect Area | Baseline (Unfixed) | Corrected (Fixed) | Verification Status |
| :--- | :--- | :--- | :--- |
| **Defect 1: Raw HTML Content Delivery** | **${d1BaselineText}** | **${d1FixedText}** | **${d1Outcome === 'RESOLVED' ? 'VERIFIED RESOLVED' : 'UNRESOLVED'}** |
| **Defect 2: Schema.org JSON-LD Structured Data** | **${d2BaselineText}** | **${d2FixedText}** | **${d2Outcome === 'RESOLVED' ? 'VERIFIED RESOLVED' : 'UNRESOLVED'}** |
| **Defect 3: Canonical & Indexability Directives** | **${d3BaselineText}** | **${d3FixedText}** | **${d3Outcome === 'RESOLVED' ? 'VERIFIED RESOLVED' : 'UNRESOLVED'}** |

---

## Negative Fixture, Mutation & Regression Verification

- **Structured Data & Directive Negative Fixtures:** ${negativeFixturesText}
- **End-to-End Page Mutations:** ${mutationsText}
- **Regression & Report Integrity:** ${regressionText}

---

## Real Extracted Code & Payload Snippets

### Defect 1: Raw HTML Server Delivery

#### Actual Captured Baseline Snippet (\`evidence/baseline/raw-html-product.html\`)
\`\`\`html
${baselineSnippet}
\`\`\`

#### Actual Captured Corrected Snippet (\`evidence/fixed/raw-html-product.html\`)
\`\`\`html
${fixedSnippet}
\`\`\`

---

### Defect 2: Schema.org JSON-LD Structured Data

#### Actual Captured Baseline JSON-LD (\`evidence/baseline/jsonld-extracted.json\`)
\`\`\`json
${baselineJsonLd}
\`\`\`

*Errors Detected in Baseline:*
${(baselineResult && baselineResult.res2 && baselineResult.res2.errors.length > 0)
    ? baselineResult.res2.errors.map(e => `- \`${e}\``).join('\n')
    : '- None'}

#### Actual Captured Corrected JSON-LD (\`evidence/fixed/jsonld-extracted.json\`)
\`\`\`json
${fixedJsonLd}
\`\`\`

*Validation Status in Corrected:*
- Schema.org Syntax Valid: \`${fixedResult && fixedResult.res2 ? fixedResult.res2.schemaOrgSyntaxValid : false}\`
- Visible Content Consistent: \`${fixedResult && fixedResult.res2 ? fixedResult.res2.visibleContentConsistent : false}\`
- Local Schema Validation Passed: \`${fixedResult && fixedResult.res2 ? fixedResult.res2.localSchemaValidationPassed : false}\`
- Official Google Rich Result Eligibility: *External manual validation required via Google Rich Results Test (not locally certified).*
- Errors: \`${d2FixedErrorsCount}\`

---

### Defect 3: Indexability & Canonical Directives

#### Actual Captured Baseline Directives
- Meta Robots: \`${JSON.stringify(baselineResult && baselineResult.res3 ? baselineResult.res3.rawRobotsList : [])}\`
- Canonical: \`${JSON.stringify(baselineResult && baselineResult.res3 ? baselineResult.res3.rawCanonicalList : [])}\`
- Errors:
${(baselineResult && baselineResult.res3 && baselineResult.res3.errors.length > 0)
    ? baselineResult.res3.errors.map(e => `  - \`${e}\``).join('\n')
    : '  - None'}

#### Actual Captured Corrected Directives
- Meta Robots: \`${JSON.stringify(fixedResult && fixedResult.res3 ? fixedResult.res3.rawRobotsList : [])}\`
- Canonical: \`${JSON.stringify(fixedResult && fixedResult.res3 ? fixedResult.res3.rawCanonicalList : [])}\`
- Errors: \`${d3FixedErrorsCount}\`

---

## Artifact Evidence Locations
- Immutable Run Directory: \`evidence/runs/${runId}/\`
- Baseline Raw HTML: \`evidence/baseline/raw-html-product.html\` (${baselineBytes} bytes)
- Baseline Rendered DOM: \`evidence/baseline/rendered-dom-product.html\` (${baselineRenderedBytes} bytes)
- Fixed Raw HTML: \`evidence/fixed/raw-html-product.html\` (${fixedBytes} bytes)
- Fixed Rendered DOM: \`evidence/fixed/rendered-dom-product.html\` (${fixedRenderedBytes} bytes)
`;
}

module.exports = {
  extractSnippetFromFile,
  generateComparisonReportMarkdown
};
