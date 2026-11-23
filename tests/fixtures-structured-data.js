/**
 * Structured Data Test Fixtures
 * Includes:
 * - Baseline negative fixtures
 * - Description negative fixtures (1-character, unrelated, unsupported claims)
 * - Multiple block / multiple offer / graph conflicts
 * - Positive fixtures for valid formatting differences (newlines, tabs, normalized quotes)
 */

const VALID_VISIBLE_FACTS = {
  title: 'Radiant Barrier Defense Serum',
  price: '$38.00 USD',
  sku: 'SKU: AB-RDS-050',
  description: 'A restorative botanical facial serum formulated with 2% niacinamide, ceramide complex, and multi-molecular hyaluronic acid to hydrate and protect the skin barrier against environmental stressors.',
  availability: 'In Stock (Demonstration Inventory)',
  hasVisibleReviews: false
};

const BASE_VALID_PRODUCT = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  'name': 'Radiant Barrier Defense Serum',
  'description': 'A restorative botanical facial serum formulated with 2% niacinamide, ceramide complex, and multi-molecular hyaluronic acid to hydrate and protect the skin barrier against environmental stressors.',
  'sku': 'AB-RDS-050',
  'brand': {
    '@type': 'Brand',
    'name': 'Aura Botanica'
  },
  'offers': {
    '@type': 'Offer',
    'price': '38.00',
    'priceCurrency': 'USD',
    'availability': 'https://schema.org/InStock',
    'url': 'https://demo.aurabotanica.example/products/radiant-barrier-serum'
  }
};

const NEGATIVE_FIXTURES = [
  // 1. Baseline 9 Fixtures
  {
    id: 'FIXTURE_1_SYNTAX_ERROR',
    description: 'Malformed JSON syntax (unquoted key and trailing comma)',
    jsonInput: `{\n  "@context": "https://schema.org",\n  "@type": "Product",\n  name: "Broken Syntax",\n}`,
    expectedErrorSubstring: 'JSON parsing error'
  },
  {
    id: 'FIXTURE_2_INVALID_TYPE',
    description: 'Invalid @type ("Thing" instead of "Product")',
    jsonInput: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Thing',
      'name': 'Radiant Barrier Defense Serum'
    }),
    expectedErrorSubstring: 'Missing \'@type\': \'Product\''
  },
  {
    id: 'FIXTURE_3_MISSING_NAME',
    description: 'Missing product name property',
    jsonInput: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      'description': VALID_VISIBLE_FACTS.description,
      'sku': 'AB-RDS-050',
      'offers': {
        '@type': 'Offer',
        'price': '38.00',
        'priceCurrency': 'USD'
      }
    }),
    expectedErrorSubstring: 'missing a non-empty \'name\' property'
  },
  {
    id: 'FIXTURE_4_NAME_MISMATCH',
    description: 'Structured data name conflicts with visible H1 title',
    jsonInput: JSON.stringify({
      ...BASE_VALID_PRODUCT,
      name: 'Generic Anti-Aging Serum'
    }),
    expectedErrorSubstring: 'Discrepancy: Product node #1 (Block #1) name ("Generic Anti-Aging Serum") does not match visible title'
  },
  {
    id: 'FIXTURE_5_MISSING_OFFERS',
    description: 'Missing mandatory commercial offers block',
    jsonInput: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      'name': 'Radiant Barrier Defense Serum',
      'description': VALID_VISIBLE_FACTS.description,
      'sku': 'AB-RDS-050'
    }),
    expectedErrorSubstring: 'missing mandatory commercial property \'offers\''
  },
  {
    id: 'FIXTURE_6_PRICE_NUMERIC_MISMATCH',
    description: 'Price numeric value mismatch (99.00 vs visible 38.00)',
    jsonInput: JSON.stringify({
      ...BASE_VALID_PRODUCT,
      offers: {
        ...BASE_VALID_PRODUCT.offers,
        price: '99.00'
      }
    }),
    expectedErrorSubstring: 'Discrepancy: Structured data price (99.00) on Offer #1 on Product #1 does not match visible price'
  },
  {
    id: 'FIXTURE_7_CURRENCY_MISMATCH',
    description: 'Currency code mismatch (EUR vs visible USD)',
    jsonInput: JSON.stringify({
      ...BASE_VALID_PRODUCT,
      offers: {
        ...BASE_VALID_PRODUCT.offers,
        priceCurrency: 'EUR'
      }
    }),
    expectedErrorSubstring: 'Discrepancy: Structured data currency ("EUR") on Offer #1 on Product #1 does not match displayed currency'
  },
  {
    id: 'FIXTURE_8_SKU_MISMATCH',
    description: 'SKU normalized mismatch (AB-RDS-999 vs visible AB-RDS-050)',
    jsonInput: JSON.stringify({
      ...BASE_VALID_PRODUCT,
      sku: 'AB-RDS-999'
    }),
    expectedErrorSubstring: 'Discrepancy: Product node #1 (Block #1) SKU ("AB-RDS-999") does not match visible normalized SKU'
  },
  {
    id: 'FIXTURE_9_FABRICATED_RATING',
    description: 'Fabricated aggregateRating present with zero visible reviews',
    jsonInput: JSON.stringify({
      ...BASE_VALID_PRODUCT,
      aggregateRating: {
        '@type': 'AggregateRating',
        'ratingValue': '4.9',
        'reviewCount': '124'
      }
    }),
    expectedErrorSubstring: 'Fabricated / Unsupported Data: Product node #1 (Block #1) includes \'aggregateRating\''
  },

  // 2. Blocker B: Exact Description Tests
  {
    id: 'FIXTURE_10_ONE_CHAR_DESCRIPTION',
    description: 'One-character truncated description ("A")',
    jsonInput: JSON.stringify({
      ...BASE_VALID_PRODUCT,
      description: 'A'
    }),
    expectedErrorSubstring: 'Invalid description: Product node #1 (Block #1) description is incomplete or too short'
  },
  {
    id: 'FIXTURE_11_UNRELATED_DESCRIPTION',
    description: 'Completely unrelated description (Organic almond butter)',
    jsonInput: JSON.stringify({
      ...BASE_VALID_PRODUCT,
      description: 'Organic creamy almond butter crafted from roasted California almonds with a pinch of sea salt.'
    }),
    expectedErrorSubstring: 'Discrepancy: Product node #1 (Block #1) description does not match visible product description'
  },
  {
    id: 'FIXTURE_12_UNSUPPORTED_DESCRIPTION_CLAIMS',
    description: 'Description includes fabricated unsupported claims',
    jsonInput: JSON.stringify({
      ...BASE_VALID_PRODUCT,
      description: 'A restorative botanical facial serum formulated with 2% niacinamide and clinically proven to permanently cure eczema and erase wrinkles in 24 hours.'
    }),
    expectedErrorSubstring: 'Discrepancy: Product node #1 (Block #1) description does not match visible product description'
  },

  // 3. Blocker C: Multiple JSON-LD Blocks & Multiple Offers
  {
    id: 'FIXTURE_13_SECOND_BLOCK_PRICE_CONFLICT',
    description: 'Second Product JSON-LD block specifies conflicting price 8.00 instead of 38.00',
    jsonInput: [
      JSON.stringify(BASE_VALID_PRODUCT),
      JSON.stringify({
        ...BASE_VALID_PRODUCT,
        offers: {
          ...BASE_VALID_PRODUCT.offers,
          price: '8.00'
        }
      })
    ],
    expectedErrorSubstring: 'Conflicting offer prices detected across structured data offers: 38.00 (Offer #1) vs 8.00 (Offer #2)'
  },
  {
    id: 'FIXTURE_14_SECOND_BLOCK_CURRENCY_CONFLICT',
    description: 'Second Product JSON-LD block specifies conflicting currency EUR instead of USD',
    jsonInput: [
      JSON.stringify(BASE_VALID_PRODUCT),
      JSON.stringify({
        ...BASE_VALID_PRODUCT,
        offers: {
          ...BASE_VALID_PRODUCT.offers,
          priceCurrency: 'EUR'
        }
      })
    ],
    expectedErrorSubstring: 'Conflicting offer currencies detected across structured data offers: "USD" (Offer #1) vs "EUR" (Offer #2)'
  },
  {
    id: 'FIXTURE_15_SECOND_BLOCK_AVAILABILITY_CONFLICT',
    description: 'Second Product JSON-LD block specifies OutOfStock while first specifies InStock',
    jsonInput: [
      JSON.stringify(BASE_VALID_PRODUCT),
      JSON.stringify({
        ...BASE_VALID_PRODUCT,
        offers: {
          ...BASE_VALID_PRODUCT.offers,
          availability: 'https://schema.org/OutOfStock'
        }
      })
    ],
    expectedErrorSubstring: 'Conflicting offer availability detected across structured data offers'
  },
  {
    id: 'FIXTURE_16_SECOND_OFFER_CONFLICT',
    description: 'Single Product with array of offers containing conflicting prices (38.00 vs 8.00)',
    jsonInput: JSON.stringify({
      ...BASE_VALID_PRODUCT,
      offers: [
        BASE_VALID_PRODUCT.offers,
        {
          ...BASE_VALID_PRODUCT.offers,
          price: '8.00'
        }
      ]
    }),
    expectedErrorSubstring: 'Conflicting offer prices detected across structured data offers: 38.00 (Offer #1) vs 8.00 (Offer #2)'
  },
  {
    id: 'FIXTURE_17_SECOND_BLOCK_MALFORMED',
    description: 'Second JSON-LD block contains malformed JSON syntax',
    jsonInput: [
      JSON.stringify(BASE_VALID_PRODUCT),
      `<script type="application/ld+json">{ broken json: true,</script>`
    ],
    expectedErrorSubstring: 'JSON parsing error in JSON-LD block #2'
  },
  {
    id: 'FIXTURE_18_GRAPH_PRODUCT_CONFLICT',
    description: 'Conflicting Product nodes inside an @graph structure',
    jsonInput: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        BASE_VALID_PRODUCT,
        {
          ...BASE_VALID_PRODUCT,
          name: 'Conflicting Barrier Cream'
        }
      ]
    }),
    expectedErrorSubstring: 'Conflicting Product nodes detected: Product node #1 has name "Radiant Barrier Defense Serum" while Product node #2 has name "Conflicting Barrier Cream"'
  }
];

const POSITIVE_FORMATTING_FIXTURES = [
  {
    id: 'VALID_FORMAT_1_WHITESPACE_AND_NEWLINES',
    description: 'Description contains newlines, carriage returns, and tabs that normalize cleanly',
    jsonInput: JSON.stringify({
      ...BASE_VALID_PRODUCT,
      description: `  A restorative botanical facial serum\n  formulated with 2% niacinamide,\r\n  ceramide complex, and multi-molecular hyaluronic acid\tto hydrate and protect the skin barrier against environmental stressors.  `
    })
  },
  {
    id: 'VALID_FORMAT_2_CURVED_QUOTES',
    description: 'Description contains standard typographical quote marks',
    jsonInput: JSON.stringify({
      ...BASE_VALID_PRODUCT,
      description: `"A restorative botanical facial serum formulated with 2% niacinamide, ceramide complex, and multi-molecular hyaluronic acid to hydrate and protect the skin barrier against environmental stressors."`
    })
  }
];

module.exports = {
  VALID_VISIBLE_FACTS,
  BASE_VALID_PRODUCT,
  NEGATIVE_FIXTURES,
  POSITIVE_FORMATTING_FIXTURES
};
