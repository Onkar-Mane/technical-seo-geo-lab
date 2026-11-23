const {
  STRUCTURED_DATA_FIXTURES,
  POSITIVE_FORMATTING_FIXTURES,
  VALID_VISIBLE_FACTS,
  RAW_HTML_NEGATIVE_FIXTURES,
  CANONICAL_INDEXING_NEGATIVE_FIXTURES
} = require('./fixtures-negative');

const { validateProductSchema } = require('./validator-schema');
const { evaluateDefect1, evaluateDefect3 } = require('./harness');

function runNegativeFixtureTests() {
  console.log('===============================================================');
  console.log('   AURA BOTANICA POC — NEGATIVE FIXTURE & MUTATION SUITE       ');
  console.log('===============================================================\n');

  let passedFixtures = 0;
  let failedFixtures = 0;
  const results = [];

  // --- CATEGORY 1: Structured Data Negative Fixtures ---
  console.log(`--- CATEGORY 1: Structured Data Negative Fixtures (${STRUCTURED_DATA_FIXTURES.length} Fixtures) ---`);
  STRUCTURED_DATA_FIXTURES.forEach((fixture) => {
    const outcome = validateProductSchema(fixture.jsonInput, VALID_VISIBLE_FACTS);
    const hasExpectedError = outcome.errors.some(err => err.includes(fixture.expectedErrorSubstring));
    const successfullyRejected = (!outcome.valid && hasExpectedError);

    if (successfullyRejected) {
      passedFixtures++;
      console.log(`  [PASS - Correctly Rejected] ${fixture.id}: ${fixture.description}`);
      results.push({ category: 'Structured Data', id: fixture.id, rejectedAsExpected: true });
    } else {
      failedFixtures++;
      console.error(`  [FAIL - False Positive or Wrong Error] ${fixture.id}: ${fixture.description}`);
      console.error(`     Expected error containing: "${fixture.expectedErrorSubstring}"`);
      console.error(`     Actual outcome: valid=${outcome.valid}, errors=${JSON.stringify(outcome.errors)}`);
      results.push({
        category: 'Structured Data',
        id: fixture.id,
        rejectedAsExpected: false,
        error: `Expected "${fixture.expectedErrorSubstring}", got ${JSON.stringify(outcome.errors)}`
      });
    }
  });

  // Category 1B: Positive Formatting Verification (Whitespace and quotes should pass)
  console.log(`\n--- CATEGORY 1B: Structured Data Positive Formatting Fixtures (${POSITIVE_FORMATTING_FIXTURES.length} Fixtures) ---`);
  POSITIVE_FORMATTING_FIXTURES.forEach((fixture) => {
    const outcome = validateProductSchema(fixture.jsonInput, VALID_VISIBLE_FACTS);
    if (outcome.valid && outcome.errors.length === 0) {
      passedFixtures++;
      console.log(`  [PASS - Correctly Accepted] ${fixture.id}: ${fixture.description}`);
      results.push({ category: 'Structured Data Formatting', id: fixture.id, rejectedAsExpected: true });
    } else {
      failedFixtures++;
      console.error(`  [FAIL - Valid Formatting Improperly Rejected] ${fixture.id}: ${fixture.description}`);
      console.error(`     Errors: ${JSON.stringify(outcome.errors)}`);
      results.push({
        category: 'Structured Data Formatting',
        id: fixture.id,
        rejectedAsExpected: false,
        error: `Unexpected errors: ${JSON.stringify(outcome.errors)}`
      });
    }
  });

  // --- CATEGORY 2: Raw / Accessible Visible Content Negative Fixtures ---
  console.log(`\n--- CATEGORY 2: Raw / Accessible Visible Content Negative Fixtures (${RAW_HTML_NEGATIVE_FIXTURES.length} Fixtures) ---`);
  RAW_HTML_NEGATIVE_FIXTURES.forEach((fixture) => {
    // Rendered DOM has nothing visible in these fixtures
    const mockRendered = { visibleBodyText: '' };
    const evalResult = evaluateDefect1(fixture.noJsDomData, mockRendered);
    const correctlyMissingAll = fixture.expectedMissingFacts.every(factName =>
      evalResult.rawMissingFacts.includes(factName)
    );
    const successfullyRejected = (!evalResult.pass && correctlyMissingAll);

    if (successfullyRejected) {
      passedFixtures++;
      console.log(`  [PASS - Correctly Rejected] ${fixture.id}: ${fixture.description}`);
      results.push({ category: 'Visible Content', id: fixture.id, rejectedAsExpected: true });
    } else {
      failedFixtures++;
      console.error(`  [FAIL - False Positive] ${fixture.id}: ${fixture.description}`);
      console.error(`     Expected missing facts: ${JSON.stringify(fixture.expectedMissingFacts)}`);
      console.error(`     Actual missing facts: ${JSON.stringify(evalResult.rawMissingFacts)}`);
      results.push({
        category: 'Visible Content',
        id: fixture.id,
        rejectedAsExpected: false,
        error: `Failed to detect all missing facts. Expected ${JSON.stringify(fixture.expectedMissingFacts)}`
      });
    }
  });

  // --- CATEGORY 3: Canonical & Indexing Directives Negative Fixtures ---
  console.log(`\n--- CATEGORY 3: Canonical & Indexing Negative Fixtures (${CANONICAL_INDEXING_NEGATIVE_FIXTURES.length} Fixtures) ---`);
  CANONICAL_INDEXING_NEGATIVE_FIXTURES.forEach((fixture) => {
    const evalResult = evaluateDefect3(fixture.rawHttpResponse, fixture.noJsDomData, fixture.renderedDomData);
    const hasExpectedError = evalResult.errors.some(err => err.includes(fixture.expectedErrorSubstring));
    const successfullyRejected = (!evalResult.pass && hasExpectedError);

    if (successfullyRejected) {
      passedFixtures++;
      console.log(`  [PASS - Correctly Rejected] ${fixture.id}: ${fixture.description}`);
      results.push({ category: 'Canonical & Indexing', id: fixture.id, rejectedAsExpected: true });
    } else {
      failedFixtures++;
      console.error(`  [FAIL - False Positive or Wrong Error] ${fixture.id}: ${fixture.description}`);
      console.error(`     Expected error containing: "${fixture.expectedErrorSubstring}"`);
      console.error(`     Actual outcome: pass=${evalResult.pass}, errors=${JSON.stringify(evalResult.errors)}`);
      results.push({
        category: 'Canonical & Indexing',
        id: fixture.id,
        rejectedAsExpected: false,
        error: `Expected error containing "${fixture.expectedErrorSubstring}", got ${JSON.stringify(evalResult.errors)}`
      });
    }
  });

  const total = passedFixtures + failedFixtures;
  console.log('\n===============================================================');
  console.log(`NEGATIVE FIXTURE SUMMARY: ${passedFixtures}/${total} FIXTURES EVALUATED ACCURATELY`);
  console.log('===============================================================');

  const allPassed = (failedFixtures === 0);
  if (!allPassed) {
    process.exitCode = 1;
  }

  return {
    allPassed,
    passedFixtures,
    failedFixtures,
    totalFixtures: total,
    results
  };
}

if (require.main === module) {
  const result = runNegativeFixtureTests();
  if (!result.allPassed) {
    process.exit(1);
  }
}

module.exports = { runNegativeFixtureTests };
