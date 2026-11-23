/**
 * Comprehensive Negative Test Fixtures for the structured-data and directive verifier
 * 
 * Categories:
 * 1. Structured Data Negative Fixtures (18 fixtures covering syntax, types, names, offers, descriptions, multiple blocks, graph, and fabricated ratings)
 * 2. Raw / Accessible Visible Content Negative Fixtures (7 fixtures covering script, comments, SVG, hidden attribute, display:none, JSON-LD, template)
 * 3. Canonical & Robots Indexing Directives Negative Fixtures (14 fixtures covering attribute order, googlebot noindex, none, X-Robots-Tag, multiple canonicals, DOM mutations)
 */

const {
  NEGATIVE_FIXTURES: STRUCTURED_DATA_FIXTURES,
  POSITIVE_FORMATTING_FIXTURES,
  VALID_VISIBLE_FACTS,
  BASE_VALID_PRODUCT
} = require('./fixtures-structured-data');

const RAW_HTML_NEGATIVE_FIXTURES = [
  {
    id: 'HTML_NEG_1_DATA_IN_SCRIPT_ONLY',
    description: 'Product data exists strictly inside JavaScript variable; visible body text contains only placeholder',
    noJsDomData: {
      visibleBodyText: 'Loading formulation details...',
      productContentVisibility: { exists: false, isVisible: false }
    },
    expectedMissingFacts: [
      'Product Title',
      'Visible Price',
      'Product SKU',
      'Primary Active (Niacinamide)',
      'Secondary Active (Ceramide NP)',
      'INCI Formulation Base'
    ]
  },
  {
    id: 'HTML_NEG_2_DATA_IN_COMMENT_ONLY',
    description: 'Product data exists strictly inside HTML comments',
    noJsDomData: {
      visibleBodyText: 'Product Catalog Under Construction',
      productContentVisibility: { exists: false, isVisible: false }
    },
    expectedMissingFacts: [
      'Product Title',
      'Visible Price',
      'Product SKU',
      'Primary Active (Niacinamide)',
      'Secondary Active (Ceramide NP)',
      'INCI Formulation Base'
    ]
  },
  {
    id: 'HTML_NEG_3_DATA_IN_SVG_ONLY',
    description: 'Product name exists strictly as vector text inside SVG graphic tag',
    noJsDomData: {
      visibleBodyText: 'Aura Botanica Demonstration Laboratory',
      productContentVisibility: { exists: false, isVisible: false }
    },
    expectedMissingFacts: ['Product Title']
  },
  {
    id: 'HTML_NEG_4_HIDDEN_ATTRIBUTE',
    description: 'Product container has "hidden" attribute; content is present in HTML source but hidden from users',
    noJsDomData: {
      visibleBodyText: 'Aura Botanica Demonstration Laboratory',
      productContentVisibility: { exists: true, isVisible: false, hasHiddenAttr: true, isDisplayNone: false }
    },
    expectedMissingFacts: [
      'Product Title',
      'Visible Price',
      'Product SKU',
      'Primary Active (Niacinamide)',
      'Secondary Active (Ceramide NP)',
      'INCI Formulation Base'
    ]
  },
  {
    id: 'HTML_NEG_5_DISPLAY_NONE',
    description: 'Product container has style="display: none;"; content is hidden from users',
    noJsDomData: {
      visibleBodyText: 'Aura Botanica Demonstration Laboratory',
      productContentVisibility: { exists: true, isVisible: false, hasHiddenAttr: false, isDisplayNone: true }
    },
    expectedMissingFacts: [
      'Product Title',
      'Visible Price',
      'Product SKU',
      'Primary Active (Niacinamide)',
      'Secondary Active (Ceramide NP)',
      'INCI Formulation Base'
    ]
  },
  {
    id: 'HTML_NEG_6_DATA_IN_JSONLD_ONLY',
    description: 'Product facts appear strictly inside JSON-LD script, visible body has only placeholder',
    noJsDomData: {
      visibleBodyText: 'Loading formulation details...',
      productContentVisibility: { exists: false, isVisible: false }
    },
    expectedMissingFacts: [
      'Product Title',
      'Visible Price',
      'Product SKU',
      'Primary Active (Niacinamide)',
      'Secondary Active (Ceramide NP)',
      'INCI Formulation Base'
    ]
  },
  {
    id: 'HTML_NEG_7_DATA_IN_TEMPLATE_ONLY',
    description: 'Product facts appear strictly inside an inert <template> element, not in accessible visible body',
    noJsDomData: {
      visibleBodyText: 'Demonstration Catalog Home',
      productContentVisibility: { exists: false, isVisible: false }
    },
    expectedMissingFacts: [
      'Product Title',
      'Visible Price',
      'Product SKU',
      'Primary Active (Niacinamide)',
      'Secondary Active (Ceramide NP)',
      'INCI Formulation Base'
    ]
  }
];

const CANONICAL_INDEXING_NEGATIVE_FIXTURES = [
  {
    id: 'CANONICAL_NEG_1_MULTIPLE_CONFLICTING',
    description: 'Multiple conflicting canonical tags present in raw HTML',
    rawHttpResponse: {
      rawHtml: `<!DOCTYPE html><html><head>
        <link rel="canonical" href="https://demo.aurabotanica.example/products/radiant-barrier-serum">
        <link rel="canonical" href="https://demo.aurabotanica.example/products/alternate-url">
        <meta name="robots" content="index, follow">
      </head><body>Content</body></html>`,
      headers: {}
    },
    noJsDomData: {
      robotsMetaList: ['index, follow'],
      googlebotMetaList: [],
      canonicalList: [
        'https://demo.aurabotanica.example/products/radiant-barrier-serum',
        'https://demo.aurabotanica.example/products/alternate-url'
      ]
    },
    renderedDomData: {
      robotsMetaList: ['index, follow'],
      googlebotMetaList: [],
      canonicalList: [
        'https://demo.aurabotanica.example/products/radiant-barrier-serum',
        'https://demo.aurabotanica.example/products/alternate-url'
      ]
    },
    expectedErrorSubstring: 'Multiple canonical link elements detected'
  },
  {
    id: 'CANONICAL_NEG_2_RELATIVE_URL',
    description: 'Canonical URL is relative instead of absolute',
    rawHttpResponse: {
      rawHtml: `<!DOCTYPE html><html><head>
        <link rel="canonical" href="/products/radiant-barrier-serum">
        <meta name="robots" content="index, follow">
      </head><body>Content</body></html>`,
      headers: {}
    },
    noJsDomData: {
      robotsMetaList: ['index, follow'],
      googlebotMetaList: [],
      canonicalList: ['/products/radiant-barrier-serum']
    },
    renderedDomData: {
      robotsMetaList: ['index, follow'],
      googlebotMetaList: [],
      canonicalList: ['/products/radiant-barrier-serum']
    },
    expectedErrorSubstring: 'Canonical URL is relative'
  },
  {
    id: 'CANONICAL_NEG_3_INSECURE_HTTP',
    description: 'Canonical URL specifies insecure HTTP protocol',
    rawHttpResponse: {
      rawHtml: `<!DOCTYPE html><html><head>
        <link rel="canonical" href="http://demo.aurabotanica.example/products/radiant-barrier-serum">
        <meta name="robots" content="index, follow">
      </head><body>Content</body></html>`,
      headers: {}
    },
    noJsDomData: {
      robotsMetaList: ['index, follow'],
      googlebotMetaList: [],
      canonicalList: ['http://demo.aurabotanica.example/products/radiant-barrier-serum']
    },
    renderedDomData: {
      robotsMetaList: ['index, follow'],
      googlebotMetaList: [],
      canonicalList: ['http://demo.aurabotanica.example/products/radiant-barrier-serum']
    },
    expectedErrorSubstring: 'Canonical URL uses insecure HTTP protocol'
  },
  {
    id: 'CANONICAL_NEG_4_STAGING_HOST',
    description: 'Canonical URL points to non-production internal staging domain',
    rawHttpResponse: {
      rawHtml: `<!DOCTYPE html><html><head>
        <link rel="canonical" href="http://staging-preprod.aurabotanica.internal/products/radiant-barrier-serum">
        <meta name="robots" content="index, follow">
      </head><body>Content</body></html>`,
      headers: {}
    },
    noJsDomData: {
      robotsMetaList: ['index, follow'],
      googlebotMetaList: [],
      canonicalList: ['http://staging-preprod.aurabotanica.internal/products/radiant-barrier-serum']
    },
    renderedDomData: {
      robotsMetaList: ['index, follow'],
      googlebotMetaList: [],
      canonicalList: ['http://staging-preprod.aurabotanica.internal/products/radiant-barrier-serum']
    },
    expectedErrorSubstring: 'Canonical URL mismatch'
  },
  {
    id: 'ROBOTS_NEG_5_NOINDEX_DIRECTIVE',
    description: 'Robots meta tag contains noindex directive',
    rawHttpResponse: {
      rawHtml: `<!DOCTYPE html><html><head>
        <link rel="canonical" href="https://demo.aurabotanica.example/products/radiant-barrier-serum">
        <meta name="robots" content="noindex, follow">
      </head><body>Content</body></html>`,
      headers: {}
    },
    noJsDomData: {
      robotsMetaList: ['noindex, follow'],
      googlebotMetaList: [],
      canonicalList: ['https://demo.aurabotanica.example/products/radiant-barrier-serum']
    },
    renderedDomData: {
      robotsMetaList: ['noindex, follow'],
      googlebotMetaList: [],
      canonicalList: ['https://demo.aurabotanica.example/products/radiant-barrier-serum']
    },
    expectedErrorSubstring: 'indexing blocker'
  },
  {
    id: 'ROBOTS_NEG_6_GOOGLEBOT_NOINDEX',
    description: 'Googlebot-specific meta tag contains noindex (name before content)',
    rawHttpResponse: {
      rawHtml: `<!DOCTYPE html><html><head>
        <link rel="canonical" href="https://demo.aurabotanica.example/products/radiant-barrier-serum">
        <meta name="robots" content="index, follow">
        <meta name="googlebot" content="noindex">
      </head><body>Content</body></html>`,
      headers: {}
    },
    noJsDomData: {
      robotsMetaList: ['index, follow'],
      googlebotMetaList: ['noindex'],
      canonicalList: ['https://demo.aurabotanica.example/products/radiant-barrier-serum']
    },
    renderedDomData: {
      robotsMetaList: ['index, follow'],
      googlebotMetaList: ['noindex'],
      canonicalList: ['https://demo.aurabotanica.example/products/radiant-barrier-serum']
    },
    expectedErrorSubstring: 'Googlebot-specific noindex blocker'
  },
  {
    id: 'ROBOTS_NEG_7_GOOGLEBOT_NOINDEX_REVERSED_ATTRS',
    description: 'Googlebot-specific meta tag contains noindex with reversed attribute order (content before name)',
    rawHttpResponse: {
      rawHtml: `<!DOCTYPE html><html><head>
        <link rel="canonical" href="https://demo.aurabotanica.example/products/radiant-barrier-serum">
        <meta content="noindex" name="googlebot">
      </head><body>Content</body></html>`,
      headers: {}
    },
    noJsDomData: {
      robotsMetaList: [],
      googlebotMetaList: ['noindex'],
      canonicalList: ['https://demo.aurabotanica.example/products/radiant-barrier-serum']
    },
    renderedDomData: {
      robotsMetaList: [],
      googlebotMetaList: ['noindex'],
      canonicalList: ['https://demo.aurabotanica.example/products/radiant-barrier-serum']
    },
    expectedErrorSubstring: 'Googlebot-specific noindex blocker'
  },
  {
    id: 'ROBOTS_NEG_8_ROBOTS_NONE',
    description: 'Robots meta tag contains "none" directive (which implies noindex, nofollow)',
    rawHttpResponse: {
      rawHtml: `<!DOCTYPE html><html><head>
        <link rel="canonical" href="https://demo.aurabotanica.example/products/radiant-barrier-serum">
        <meta name="robots" content="none">
      </head><body>Content</body></html>`,
      headers: {}
    },
    noJsDomData: {
      robotsMetaList: ['none'],
      googlebotMetaList: [],
      canonicalList: ['https://demo.aurabotanica.example/products/radiant-barrier-serum']
    },
    renderedDomData: {
      robotsMetaList: ['none'],
      googlebotMetaList: [],
      canonicalList: ['https://demo.aurabotanica.example/products/radiant-barrier-serum']
    },
    expectedErrorSubstring: '\'none\' directive (implies noindex, nofollow)'
  },
  {
    id: 'ROBOTS_NEG_9_X_ROBOTS_TAG_HEADER',
    description: 'HTTP response header contains X-Robots-Tag: noindex',
    rawHttpResponse: {
      rawHtml: `<!DOCTYPE html><html><head>
        <link rel="canonical" href="https://demo.aurabotanica.example/products/radiant-barrier-serum">
        <meta name="robots" content="index, follow">
      </head><body>Content</body></html>`,
      headers: {
        'x-robots-tag': 'noindex, nofollow'
      }
    },
    noJsDomData: {
      robotsMetaList: ['index, follow'],
      googlebotMetaList: [],
      canonicalList: ['https://demo.aurabotanica.example/products/radiant-barrier-serum']
    },
    renderedDomData: {
      robotsMetaList: ['index, follow'],
      googlebotMetaList: [],
      canonicalList: ['https://demo.aurabotanica.example/products/radiant-barrier-serum']
    },
    expectedErrorSubstring: 'HTTP header \'X-Robots-Tag\' contains noindex directive'
  },
  {
    id: 'ROBOTS_NEG_10_X_ROBOTS_TAG_GOOGLEBOT_NONE',
    description: 'HTTP response header contains X-Robots-Tag: googlebot: none',
    rawHttpResponse: {
      rawHtml: `<!DOCTYPE html><html><head>
        <link rel="canonical" href="https://demo.aurabotanica.example/products/radiant-barrier-serum">
        <meta name="robots" content="index, follow">
      </head><body>Content</body></html>`,
      headers: {
        'x-robots-tag': 'googlebot: none'
      }
    },
    noJsDomData: {
      robotsMetaList: ['index, follow'],
      googlebotMetaList: [],
      canonicalList: ['https://demo.aurabotanica.example/products/radiant-barrier-serum']
    },
    renderedDomData: {
      robotsMetaList: ['index, follow'],
      googlebotMetaList: [],
      canonicalList: ['https://demo.aurabotanica.example/products/radiant-barrier-serum']
    },
    expectedErrorSubstring: 'HTTP header \'X-Robots-Tag\' contains \'none\' directive'
  },
  {
    id: 'ROBOTS_NEG_11_CONFLICTING_DIRECTIVES',
    description: 'Meta robots contains conflicting directives ("index, noindex")',
    rawHttpResponse: {
      rawHtml: `<!DOCTYPE html><html><head>
        <link rel="canonical" href="https://demo.aurabotanica.example/products/radiant-barrier-serum">
        <meta name="robots" content="index, noindex">
      </head><body>Content</body></html>`,
      headers: {}
    },
    noJsDomData: {
      robotsMetaList: ['index, noindex'],
      googlebotMetaList: [],
      canonicalList: ['https://demo.aurabotanica.example/products/radiant-barrier-serum']
    },
    renderedDomData: {
      robotsMetaList: ['index, noindex'],
      googlebotMetaList: [],
      canonicalList: ['https://demo.aurabotanica.example/products/radiant-barrier-serum']
    },
    expectedErrorSubstring: 'conflicting indexing directives'
  },
  {
    id: 'CANONICAL_NEG_12_DOM_MUTATION_CHANGED',
    description: 'Client-side JavaScript mutates canonical URL in rendered DOM',
    rawHttpResponse: {
      rawHtml: `<!DOCTYPE html><html><head>
        <link rel="canonical" href="https://demo.aurabotanica.example/products/radiant-barrier-serum">
        <meta name="robots" content="index, follow">
      </head><body>Content</body></html>`,
      headers: {}
    },
    noJsDomData: {
      robotsMetaList: ['index, follow'],
      googlebotMetaList: [],
      canonicalList: ['https://demo.aurabotanica.example/products/radiant-barrier-serum']
    },
    renderedDomData: {
      robotsMetaList: ['index, follow'],
      googlebotMetaList: [],
      canonicalList: ['https://demo.aurabotanica.example/products/mutated-by-javascript']
    },
    expectedErrorSubstring: 'Canonical mismatch between server HTML'
  },
  {
    id: 'CANONICAL_NEG_13_DOM_MUTATION_REMOVED',
    description: 'Client-side JavaScript removes canonical link element from rendered DOM',
    rawHttpResponse: {
      rawHtml: `<!DOCTYPE html><html><head>
        <link rel="canonical" href="https://demo.aurabotanica.example/products/radiant-barrier-serum">
        <meta name="robots" content="index, follow">
      </head><body>Content</body></html>`,
      headers: {}
    },
    noJsDomData: {
      robotsMetaList: ['index, follow'],
      googlebotMetaList: [],
      canonicalList: ['https://demo.aurabotanica.example/products/radiant-barrier-serum']
    },
    renderedDomData: {
      robotsMetaList: ['index, follow'],
      googlebotMetaList: [],
      canonicalList: []
    },
    expectedErrorSubstring: 'Canonical link removed by JavaScript in rendered DOM'
  },
  {
    id: 'ROBOTS_NEG_14_DOM_MUTATION_GOOGLEBOT_INSERTED',
    description: 'Client-side JavaScript inserts googlebot noindex directive into rendered DOM',
    rawHttpResponse: {
      rawHtml: `<!DOCTYPE html><html><head>
        <link rel="canonical" href="https://demo.aurabotanica.example/products/radiant-barrier-serum">
        <meta name="robots" content="index, follow">
      </head><body>Content</body></html>`,
      headers: {}
    },
    noJsDomData: {
      robotsMetaList: ['index, follow'],
      googlebotMetaList: [],
      canonicalList: ['https://demo.aurabotanica.example/products/radiant-barrier-serum']
    },
    renderedDomData: {
      robotsMetaList: ['index, follow'],
      googlebotMetaList: ['noindex'],
      canonicalList: ['https://demo.aurabotanica.example/products/radiant-barrier-serum']
    },
    expectedErrorSubstring: 'JavaScript client DOM inserted Googlebot noindex blocker'
  }
];

module.exports = {
  STRUCTURED_DATA_FIXTURES,
  POSITIVE_FORMATTING_FIXTURES,
  VALID_VISIBLE_FACTS,
  BASE_VALID_PRODUCT,
  RAW_HTML_NEGATIVE_FIXTURES,
  CANONICAL_INDEXING_NEGATIVE_FIXTURES
};
