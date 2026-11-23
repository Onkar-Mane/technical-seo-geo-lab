const http = require('http');
const fs = require('fs');
const path = require('path');
const {
  fetchRawHttpResponse,
  fetchNoJsDom,
  fetchRenderedDom,
  evaluateDefect1,
  evaluateDefect2,
  evaluateDefect3
} = require('./harness');

const FIXED_PAGE_PATH = path.resolve(__dirname, '../site/fixed/products/radiant-barrier-serum.html');
const BASE_HTML = fs.readFileSync(FIXED_PAGE_PATH, 'utf8');

const MUTATIONS = [
  // --- Defect 1 Mutations (Visible Content) ---
  {
    id: 'MUTATION_1_HIDDEN_ATTR',
    defectArea: 'Defect 1',
    description: 'Add "hidden" attribute to #product-content container',
    mutate: (html) => html.replace('<div id="product-content">', '<div id="product-content" hidden>'),
    evaluate: async (url, rawResp, noJsDom, renderedDom) => evaluateDefect1(noJsDom, renderedDom),
    expectedErrorSubstring: 'missing' // At least some facts missing due to hidden
  },
  {
    id: 'MUTATION_2_DISPLAY_NONE',
    defectArea: 'Defect 1',
    description: 'Add style="display: none;" to #product-content container',
    mutate: (html) => html.replace('<div id="product-content">', '<div id="product-content" style="display: none;">'),
    evaluate: async (url, rawResp, noJsDom, renderedDom) => evaluateDefect1(noJsDom, renderedDom),
    expectedErrorSubstring: 'missing'
  },
  {
    id: 'MUTATION_3_DATA_IN_SCRIPT_ONLY',
    defectArea: 'Defect 1',
    description: 'Remove visible product facts and embed them strictly in <script> variables',
    mutate: (html) => html.replace(
      /<div id="product-content">[\s\S]*?<\/div>\s*<\/div>/,
      '<div id="product-content"><script>const title="Radiant Barrier Defense Serum"; const price="$38.00";</script></div></div>'
    ),
    evaluate: async (url, rawResp, noJsDom, renderedDom) => evaluateDefect1(noJsDom, renderedDom),
    expectedErrorSubstring: 'missing'
  },
  {
    id: 'MUTATION_4_DATA_IN_COMMENT_ONLY',
    defectArea: 'Defect 1',
    description: 'Wrap product details strictly inside an HTML comment so visible body text is omitted',
    mutate: (html) => html.replace(
      /<div id="product-content">[\s\S]*?<\/button>\s*<\/div>\s*<\/div>/,
      '<div id="product-content"><!-- Radiant Barrier Defense Serum, $38.00, AB-RDS-050, 2% Niacinamide, Ceramide NP, Aqua (Water) --></div></div>'
    ),
    evaluate: async (url, rawResp, noJsDom, renderedDom) => evaluateDefect1(noJsDom, renderedDom),
    expectedErrorSubstring: 'missing'
  },
  {
    id: 'MUTATION_5_DATA_IN_TEMPLATE',
    defectArea: 'Defect 1',
    description: 'Wrap product details strictly inside an inert <template> element',
    mutate: (html) => html.replace(
      '<div id="product-content">',
      '<div id="product-content"><template>'
    ).replace(/<\/button>\r?\n\s*<\/div>\r?\n\s*<\/div>/, '</button>\n        </div></template>\n      </div>'),
    evaluate: async (url, rawResp, noJsDom, renderedDom) => evaluateDefect1(noJsDom, renderedDom),
    expectedErrorSubstring: 'missing'
  },

  // --- Defect 2 Mutations (Structured Data) ---
  {
    id: 'MUTATION_6_SECOND_PRODUCT_PRICE_8',
    defectArea: 'Defect 2',
    description: 'Add second JSON-LD block with conflicting price 8.00 instead of 38.00',
    mutate: (html) => html.replace(
      '</head>',
      `<script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Radiant Barrier Defense Serum",
        "description": "A restorative botanical facial serum formulated with 2% niacinamide, ceramide complex, and multi-molecular hyaluronic acid to hydrate and protect the skin barrier against environmental stressors.",
        "sku": "AB-RDS-050",
        "offers": {
          "@type": "Offer",
          "price": "8.00",
          "priceCurrency": "USD"
        }
      }
      </script></head>`
    ),
    evaluate: async (url, rawResp, noJsDom, renderedDom) => evaluateDefect2(rawResp.rawHtml, renderedDom.visibleFacts),
    expectedErrorSubstring: 'Conflicting offer prices detected across structured data offers: 38.00 (Offer #1) vs 8.00 (Offer #2)'
  },
  {
    id: 'MUTATION_7_SECOND_PRODUCT_EUR',
    defectArea: 'Defect 2',
    description: 'Add second JSON-LD block with conflicting currency EUR instead of USD',
    mutate: (html) => html.replace(
      '</head>',
      `<script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Radiant Barrier Defense Serum",
        "description": "A restorative botanical facial serum formulated with 2% niacinamide, ceramide complex, and multi-molecular hyaluronic acid to hydrate and protect the skin barrier against environmental stressors.",
        "sku": "AB-RDS-050",
        "offers": {
          "@type": "Offer",
          "price": "38.00",
          "priceCurrency": "EUR"
        }
      }
      </script></head>`
    ),
    expectedErrorSubstring: 'Conflicting offer currencies detected across structured data offers: "USD" (Offer #1) vs "EUR" (Offer #2)'
  },
  {
    id: 'MUTATION_8_SECOND_PRODUCT_OUT_OF_STOCK',
    defectArea: 'Defect 2',
    description: 'Add second JSON-LD block specifying OutOfStock while visible text says In Stock',
    mutate: (html) => html.replace(
      '</head>',
      `<script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Radiant Barrier Defense Serum",
        "description": "A restorative botanical facial serum formulated with 2% niacinamide, ceramide complex, and multi-molecular hyaluronic acid to hydrate and protect the skin barrier against environmental stressors.",
        "sku": "AB-RDS-050",
        "offers": {
          "@type": "Offer",
          "price": "38.00",
          "priceCurrency": "USD",
          "availability": "https://schema.org/OutOfStock"
        }
      }
      </script></head>`
    ),
    expectedErrorSubstring: 'Conflicting offer availability detected across structured data offers'
  },
  {
    id: 'MUTATION_9_CONFLICTING_OFFERS_ARRAY',
    defectArea: 'Defect 2',
    description: 'Configure offers as an array containing conflicting prices 38.00 and 8.00',
    mutate: (html) => html.replace(
      '"offers": {',
      `"offers": [{
        "@type": "Offer",
        "price": "38.00",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock",
        "url": "https://demo.aurabotanica.example/products/radiant-barrier-serum"
      }, {
        "@type": "Offer",
        "price": "8.00",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock",
        "url": "https://demo.aurabotanica.example/products/radiant-barrier-serum"
      }], "_unused": {`
    ),
    expectedErrorSubstring: 'Conflicting offer prices detected across structured data offers: 38.00 (Offer #1) vs 8.00 (Offer #2)'
  },
  {
    id: 'MUTATION_10_GRAPH_CONFLICTING_PRODUCTS',
    defectArea: 'Defect 2',
    description: 'Configure @graph structure with two Product nodes having conflicting names',
    mutate: (html) => html.replace(
      /<script type="application\/ld\+json">\r?\n\s*\{/,
      `<script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@graph": [
          {`
    ).replace(
      /\}\r?\n\s*\}\r?\n\s*<\/script>/,
      `  }
          },
          {
            "@type": "Product",
            "name": "Conflicting Night Treatment Serum",
            "sku": "AB-RDS-050",
            "description": "A restorative botanical facial serum formulated with 2% niacinamide, ceramide complex, and multi-molecular hyaluronic acid to hydrate and protect the skin barrier against environmental stressors.",
            "offers": {
              "@type": "Offer",
              "price": "38.00",
              "priceCurrency": "USD"
            }
          }
        ]
      }
      </script>`
    ),
    expectedErrorSubstring: 'Conflicting Product nodes detected'
  },
  {
    id: 'MUTATION_11_MALFORMED_SECOND_JSONLD',
    defectArea: 'Defect 2',
    description: 'Append second JSON-LD block containing unparseable malformed JSON syntax',
    mutate: (html) => html.replace(
      '</head>',
      `<script type="application/ld+json">\n{\n  "@type": "Product",\n  broken: JSON,\n}\n</script></head>`
    ),
    expectedErrorSubstring: 'JSON parsing error in JSON-LD block #2'
  },
  {
    id: 'MUTATION_12_DESCRIPTION_ONE_CHAR',
    defectArea: 'Defect 2',
    description: 'Change JSON-LD description to a 1-character incomplete string ("A")',
    mutate: (html) => html.replace(
      /"description":\s*"[^"]+"/,
      '"description": "A"'
    ),
    expectedErrorSubstring: 'description is incomplete or too short'
  },

  // --- Defect 3 Mutations (Directives & Canonical) ---
  {
    id: 'MUTATION_13_GOOGLEBOT_NOINDEX_REVERSED',
    defectArea: 'Defect 3',
    description: 'Inject <meta content="noindex" name="googlebot"> with reversed attribute order',
    mutate: (html) => html.replace(
      '</head>',
      '<meta content="noindex" name="googlebot"></head>'
    ),
    evaluate: async (url, rawResp, noJsDom, renderedDom) => evaluateDefect3(rawResp, noJsDom, renderedDom),
    expectedErrorSubstring: 'Googlebot-specific noindex blocker'
  },
  {
    id: 'MUTATION_14_DOM_GOOGLEBOT_INSERTED',
    defectArea: 'Defect 3',
    description: 'Inject client-side JavaScript that appends googlebot noindex into rendered DOM',
    mutate: (html) => html.replace(
      '</body>',
      `<script>
        const m = document.createElement('meta');
        m.name = 'googlebot';
        m.content = 'noindex';
        document.head.appendChild(m);
      </script></body>`
    ),
    evaluate: async (url, rawResp, noJsDom, renderedDom) => evaluateDefect3(rawResp, noJsDom, renderedDom),
    expectedErrorSubstring: 'JavaScript client DOM inserted Googlebot noindex blocker'
  },
  {
    id: 'MUTATION_15_DOM_CANONICAL_REMOVED',
    defectArea: 'Defect 3',
    description: 'Inject client-side JavaScript that removes canonical tag from rendered DOM',
    mutate: (html) => html.replace(
      '</body>',
      `<script>
        const c = document.querySelector('link[rel="canonical"]');
        if (c) c.remove();
      </script></body>`
    ),
    evaluate: async (url, rawResp, noJsDom, renderedDom) => evaluateDefect3(rawResp, noJsDom, renderedDom),
    expectedErrorSubstring: 'Canonical link removed by JavaScript in rendered DOM'
  },
  {
    id: 'MUTATION_16_DUPLICATE_CANONICAL',
    defectArea: 'Defect 3',
    description: 'Add duplicate conflicting canonical link tag pointing to alternate URL',
    mutate: (html) => html.replace(
      '<link rel="canonical"',
      '<link rel="canonical" href="https://demo.aurabotanica.example/products/alternate-serum">\n  <link rel="canonical"'
    ),
    evaluate: async (url, rawResp, noJsDom, renderedDom) => evaluateDefect3(rawResp, noJsDom, renderedDom),
    expectedErrorSubstring: 'Multiple canonical link elements detected'
  },

  // --- Additional adversarial mutations ---
  {
    id: 'MUTATION_17_VISIBLE_PRICE_REMOVED',
    defectArea: 'Defect 1',
    description: 'Omit visible price tag from rendered DOM markup (O03)',
    mutate: (html) => html.replace(/<span class="price-value"[^>]*>\$38\.00 USD<\/span>/, ''),
    evaluate: async (url, rawResp, noJsDom, renderedDom) => evaluateDefect1(noJsDom, renderedDom),
    expectedErrorSubstring: 'Missing facts in server-delivered visible text'
  },
  {
    id: 'MUTATION_18_VISIBLE_SKU_CHANGED',
    defectArea: 'Defect 2',
    description: 'Change visible SKU tag to conflicting SKU AB-RDS-999 (O06)',
    mutate: (html) => html.replace('SKU: AB-RDS-050', 'SKU: AB-RDS-999'),
    expectedErrorSubstring: 'SKU'
  },
  {
    id: 'MUTATION_19_GOOGLEBOT_NOINDEX',
    defectArea: 'Defect 3',
    description: 'Inject <meta name="googlebot" content="noindex"> tag (O07)',
    mutate: (html) => html.replace('</head>', '<meta name="googlebot" content="noindex"></head>'),
    evaluate: async (url, rawResp, noJsDom, renderedDom) => evaluateDefect3(rawResp, noJsDom, renderedDom),
    expectedErrorSubstring: 'Googlebot-specific noindex blocker'
  },
  {
    id: 'MUTATION_20_UNQUOTED_ROBOTS_NOINDEX',
    defectArea: 'Defect 3',
    description: 'Inject unquoted <meta name=robots content=noindex> (O09)',
    mutate: (html) => html.replace(/<meta name="robots" content="index, follow">/, '<meta name=robots content=noindex>'),
    evaluate: async (url, rawResp, noJsDom, renderedDom) => evaluateDefect3(rawResp, noJsDom, renderedDom),
    expectedErrorSubstring: 'indexing blocker'
  },
  {
    id: 'MUTATION_21_WEBPAGE_MAINENTITY_CONFLICT',
    defectArea: 'Defect 2',
    description: 'Second JSON-LD block: WebPage with mainEntity Product at $8.00 OutOfStock (N02)',
    mutate: (html) => html.replace('</head>', '<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage","name":"Radiant Barrier Defense Serum","mainEntity":{"@type":"Product","name":"Radiant Barrier Defense Serum","sku":"AB-RDS-050","offers":{"@type":"Offer","price":"8.00","priceCurrency":"USD","availability":"https://schema.org/OutOfStock"}}}</script>\n</head>'),
    expectedErrorSubstring: 'Conflicting offer prices detected across structured data offers'
  },
  {
    id: 'MUTATION_22_PRODUCT_TYPE_ARRAY_CONFLICT',
    defectArea: 'Defect 2',
    description: 'Second JSON-LD block: "@type": ["Product"] at $8.00 (N03)',
    mutate: (html) => html.replace('</head>', '<script type="application/ld+json">{"@context":"https://schema.org","@type":["Product"],"name":"Radiant Barrier Defense Serum","sku":"AB-RDS-050","offers":{"@type":"Offer","price":"8.00","priceCurrency":"USD"}}</script>\n</head>'),
    expectedErrorSubstring: 'Conflicting offer prices detected across structured data offers'
  },
  {
    id: 'MUTATION_23_JS_INJECTED_JSONLD_CONFLICT',
    defectArea: 'Defect 2',
    description: 'JavaScript appends conflicting $8.00 JSON-LD block after DOMContentLoaded (N04)',
    mutate: (html) => html.replace('</head>', '<script>document.addEventListener("DOMContentLoaded",function(){var s=document.createElement("script");s.type="application/ld+json";s.textContent=JSON.stringify({"@context":"https://schema.org","@type":"Product","name":"Radiant Barrier Defense Serum","sku":"AB-RDS-050","offers":{"@type":"Offer","price":"8.00","priceCurrency":"USD"}});document.head.appendChild(s);});</script>\n</head>'),
    expectedErrorSubstring: 'JavaScript client DOM modified or injected JSON-LD'
  },
  {
    id: 'MUTATION_24_VISIBLE_DESC_HIDDEN_CSS',
    defectArea: 'Defect 2',
    description: 'Visible description hidden via stylesheet class .visually-collapsed (N05)',
    mutate: (html) => html
      .replace('</head>', '<style>.visually-collapsed{display:none}</style>\n</head>')
      .replace('<p class="product-description" id="visible-description">', '<p class="product-description visually-collapsed" id="visible-description">'),
    expectedErrorSubstring: 'visible product description is empty or not found'
  },
  {
    id: 'MUTATION_25_VISIBLE_SOLD_OUT_VS_INSTOCK',
    defectArea: 'Defect 2',
    description: 'Visible text indicates "Sold Out" while JSON-LD specifies InStock (N06)',
    mutate: (html) => html.replace('In Stock (Demonstration Inventory)', 'Sold Out (Demonstration Inventory)'),
    expectedErrorSubstring: 'Visible text indicates OutOfStock'
  }
];

async function runAllMutations() {
  console.log('===============================================================');
  console.log(`   AURA BOTANICA POC — ${MUTATIONS.length} PAGE MUTATION REGRESSION SUITE       `);
  console.log('===============================================================\n');

  let currentHtmlToServe = BASE_HTML;
  const mockPort = 3897;
  const mockServer = http.createServer((req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=UTF-8',
      'Content-Length': Buffer.byteLength(currentHtmlToServe, 'utf8')
    });
    res.end(currentHtmlToServe);
  });

  await new Promise(resolve => mockServer.listen(mockPort, '127.0.0.1', resolve));

  let passedMutations = 0;
  let failedMutations = 0;
  const results = [];

  try {
    const testUrl = `http://127.0.0.1:${mockPort}/test-page.html`;

    for (const mutation of MUTATIONS) {
      const mutated = mutation.mutate(BASE_HTML);
      if (mutated === BASE_HTML) {
        throw new Error(`Mutation ${mutation.id} failed to modify BASE_HTML! Line ending or target string mismatch.`);
      }
      currentHtmlToServe = mutated;

      const rawResp = await fetchRawHttpResponse(testUrl);
      const noJsDom = await fetchNoJsDom(testUrl);
      const renderedDom = await fetchRenderedDom(testUrl);

      let evalResult;
      if (mutation.evaluate) {
        evalResult = await mutation.evaluate(testUrl, rawResp, noJsDom, renderedDom);
      } else if (mutation.defectArea === 'Defect 2') {
        evalResult = evaluateDefect2(rawResp.rawHtml, renderedDom.visibleFacts, renderedDom.jsonLdBlocks);
      } else if (mutation.defectArea === 'Defect 1') {
        evalResult = evaluateDefect1(noJsDom, renderedDom);
      } else {
        evalResult = evaluateDefect3(rawResp, noJsDom, renderedDom);
      }

      // Assert that the mutation caused the check to FAIL and produce expected error
      const didFail = (evalResult.pass === false);
      let hasExpectedError = false;

      if (evalResult.errors) {
        hasExpectedError = evalResult.errors.some(err => err.toLowerCase().includes(mutation.expectedErrorSubstring.toLowerCase()));
      } else if (evalResult.rawMissingFacts) {
        hasExpectedError = (evalResult.rawMissingFacts.length > 0);
      }

      const passedAsExpected = (didFail && hasExpectedError);

      if (passedAsExpected) {
        passedMutations++;
        console.log(`  [PASS - Correctly Rejected] ${mutation.id}: ${mutation.description}`);
        results.push({ id: mutation.id, defectArea: mutation.defectArea, passed: true });
      } else {
        failedMutations++;
        console.error(`  [FAIL - Mutation Failed to Trigger Error] ${mutation.id}: ${mutation.description}`);
        console.error(`     evalResult.pass: ${evalResult.pass}`);
        console.error(`     evalResult.errors: ${JSON.stringify(evalResult.errors || evalResult.rawMissingFacts)}`);
        console.error(`     Expected error substring: "${mutation.expectedErrorSubstring}"`);
        results.push({
          id: mutation.id,
          defectArea: mutation.defectArea,
          passed: false,
          actualErrors: evalResult.errors || evalResult.rawMissingFacts
        });
      }
    }

    const total = passedMutations + failedMutations;
    console.log('\n===============================================================');
    console.log(`MUTATION SUITE SUMMARY: ${passedMutations}/${total} MUTATIONS DETECTED ACCURATELY`);
    console.log('===============================================================');

    const allPassed = (failedMutations === 0);
    if (!allPassed) {
      process.exitCode = 1;
    }

    return {
      allPassed,
      passedMutations,
      failedMutations,
      totalMutations: total,
      results
    };
  } finally {
    mockServer.close();
  }
}

if (require.main === module) {
  runAllMutations().catch(err => {
    console.error('Fatal mutation test error:', err);
    process.exit(1);
  });
}

module.exports = { runAllMutations, MUTATIONS };
