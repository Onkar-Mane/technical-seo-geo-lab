const http = require('http');
const { chromium } = require('playwright');
const { validateProductSchema } = require('./validator-schema');

/**
 * Perform a raw HTTP GET request (captures raw bytes, string, and headers)
 */
function fetchRawHttpResponse(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          rawHtml: data,
          byteLength: Buffer.byteLength(data, 'utf8')
        });
      });
    }).on('error', reject);
  });
}

/**
 * Launch headless browser with JavaScript DISABLED.
 * Evaluates the actual accessible visible DOM content delivered by the server without client script execution.
 */
async function fetchNoJsDom(url) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const headers = response ? response.headers() : {};
    const htmlContent = await page.content();

    const domData = await page.evaluate(() => {
      // Extract visible text using innerText (excludes hidden, display:none, script, style, comments)
      const visibleBodyText = document.body ? document.body.innerText : '';

      const getAttr = (selector, attr) => {
        const el = document.querySelector(selector);
        return el ? el.getAttribute(attr) : null;
      };

      const getAllAttrs = (selector, attr) => {
        const els = document.querySelectorAll(selector);
        return Array.from(els).map(el => el.getAttribute(attr)).filter(Boolean);
      };

      // Check element visibility for product content
      const checkElVisibility = (selector) => {
        const el = document.querySelector(selector);
        if (!el) return { exists: false, isVisible: false };
        const style = window.getComputedStyle(el);
        const hasHiddenAttr = el.hasAttribute('hidden');
        const isDisplayNone = style.display === 'none';
        const isVisibilityHidden = style.visibility === 'hidden';
        const isVisible = !hasHiddenAttr && !isDisplayNone && !isVisibilityHidden;
        return { exists: true, isVisible, hasHiddenAttr, isDisplayNone, isVisibilityHidden };
      };

      // Attribute-order-agnostic meta extraction
      const getMetaDirectives = (nameRegex) => {
        const metas = Array.from(document.querySelectorAll('meta'));
        return metas
          .filter(m => {
            const name = m.getAttribute('name');
            return name && nameRegex.test(name);
          })
          .map(m => m.getAttribute('content'))
          .filter(Boolean);
      };

      // JSON-LD blocks
      const jsonLdBlocks = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
        .map(s => s.textContent ? s.textContent.trim() : '')
        .filter(Boolean);

      return {
        visibleBodyText,
        productContentVisibility: checkElVisibility('#product-content'),
        clientContainerVisibility: checkElVisibility('#client-product-container'),
        robotsMetaList: getMetaDirectives(/^robots$/i),
        googlebotMetaList: getMetaDirectives(/^googlebot$/i),
        canonicalList: getAllAttrs('link[rel="canonical" i]', 'href'),
        jsonLdBlocks
      };
    });

    return {
      htmlContent,
      byteLength: Buffer.byteLength(htmlContent, 'utf8'),
      headers,
      ...domData
    };
  } finally {
    await browser.close();
  }
}

/**
 * Launch headless browser with JavaScript ENABLED.
 * Evaluates rendered visible content, hydrated DOM, and dynamic metadata mutations.
 */
async function fetchRenderedDom(url) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ javaScriptEnabled: true });
  const page = await context.newPage();

  try {
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    // Small buffer for client-side setTimeout in baseline
    await page.waitForTimeout(300);

    const renderedHtml = await page.content();
    const headers = response ? response.headers() : {};

    const domData = await page.evaluate(() => {
      const visibleBodyText = document.body ? document.body.innerText : '';

      const isElementVisible = (el) => {
        if (!el) return false;
        let current = el;
        while (current && current !== document.body && current !== document.documentElement) {
          if (current.hasAttribute('hidden')) return false;
          const style = window.getComputedStyle(current);
          if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse') {
            return false;
          }
          current = current.parentElement;
        }
        return true;
      };

      const getVisibleText = (selector) => {
        const el = document.querySelector(selector);
        if (!el || !isElementVisible(el)) return null;
        const text = el.innerText !== undefined ? el.innerText.trim() : el.textContent.trim();
        return text || null;
      };

      const getText = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.textContent.trim() : null;
      };

      const getAttr = (selector, attr) => {
        const el = document.querySelector(selector);
        return el ? el.getAttribute(attr) : null;
      };

      const getAllAttrs = (selector, attr) => {
        const els = document.querySelectorAll(selector);
        return Array.from(els).map(el => el.getAttribute(attr)).filter(Boolean);
      };

      const checkElVisibility = (selector) => {
        const el = document.querySelector(selector);
        if (!el) return { exists: false, isVisible: false };
        const style = window.getComputedStyle(el);
        const hasHiddenAttr = el.hasAttribute('hidden');
        const isDisplayNone = style.display === 'none';
        const isVisibilityHidden = style.visibility === 'hidden';
        const isVisible = !hasHiddenAttr && !isDisplayNone && !isVisibilityHidden;
        return { exists: true, isVisible, hasHiddenAttr, isDisplayNone, isVisibilityHidden };
      };

      const getMetaDirectives = (nameRegex) => {
        const metas = Array.from(document.querySelectorAll('meta'));
        return metas
          .filter(m => {
            const name = m.getAttribute('name');
            return name && nameRegex.test(name);
          })
          .map(m => m.getAttribute('content'))
          .filter(Boolean);
      };

      const jsonLdBlocks = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
        .map(s => s.textContent ? s.textContent.trim() : '')
        .filter(Boolean);

      return {
        visibleBodyText,
        productContentVisibility: checkElVisibility('#product-content'),
        clientContainerVisibility: checkElVisibility('#client-product-container'),
        visibleFacts: {
          title: getVisibleText('#visible-title') || getVisibleText('h1'),
          price: getVisibleText('#visible-price') || getVisibleText('.price-value'),
          sku: getVisibleText('#visible-sku') || getVisibleText('.sku-tag'),
          description: getVisibleText('#visible-description') || getVisibleText('.product-description'),
          ingredients: getVisibleText('#visible-ingredients') || getVisibleText('.ingredients-list'),
          availability: getVisibleText('.availability-tag'),
          hasVisibleReviews: Boolean(document.querySelector('.review-item, .reviews-container, [data-review]'))
        },
        robotsMetaList: getMetaDirectives(/^robots$/i),
        googlebotMetaList: getMetaDirectives(/^googlebot$/i),
        canonicalList: getAllAttrs('link[rel="canonical" i]', 'href'),
        jsonLdBlocks
      };
    });

    return {
      renderedHtml,
      byteLength: Buffer.byteLength(renderedHtml, 'utf8'),
      headers,
      ...domData
    };
  } finally {
    await browser.close();
  }
}

/**
 * Extract all JSON-LD script blocks from an HTML string (Blocker C)
 */
function extractAllJsonLdBlocks(html) {
  if (!html || typeof html !== 'string') return [];
  const blocks = [];
  const regex = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const content = match[1].trim();
    if (content) {
      blocks.push(content);
    }
  }
  return blocks;
}

/**
 * Attribute-order-agnostic meta directive extractor for raw HTML (Blocker F)
 * Robust to whitespace around '=' and unquoted/quoted attributes.
 */
function extractMetaDirectivesFromRawHtml(html, targetName) {
  if (!html || typeof html !== 'string') return [];
  const directives = [];
  const metaRegex = /<meta\b([^>]*)>/gi;
  let match;
  while ((match = metaRegex.exec(html)) !== null) {
    const attrsStr = match[1];
    const nameMatch = attrsStr.match(/\bname\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const contentMatch = attrsStr.match(/\bcontent\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const nameVal = nameMatch ? (nameMatch[1] || nameMatch[2] || nameMatch[3]) : null;
    const contentVal = contentMatch ? (contentMatch[1] || contentMatch[2] || contentMatch[3]) : null;
    if (nameVal && contentVal) {
      if (nameVal.toLowerCase() === targetName.toLowerCase()) {
        directives.push(contentVal.trim());
      }
    }
  }
  return directives;
}

/**
 * Attribute-order-agnostic canonical link extractor for raw HTML (Blocker F)
 * Robust to whitespace around '=' and unquoted/quoted attributes.
 */
function extractCanonicalsFromRawHtml(html) {
  if (!html || typeof html !== 'string') return [];
  const canonicals = [];
  const linkRegex = /<link\b([^>]*)>/gi;
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const attrsStr = match[1];
    const relMatch = attrsStr.match(/\brel\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const hrefMatch = attrsStr.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const relVal = relMatch ? (relMatch[1] || relMatch[2] || relMatch[3]) : null;
    const hrefVal = hrefMatch ? (hrefMatch[1] || hrefMatch[2] || hrefMatch[3]) : null;
    if (relVal && hrefVal) {
      if (relVal.toLowerCase() === 'canonical') {
        canonicals.push(hrefVal.trim());
      }
    }
  }
  return canonicals;
}

/**
 * Defect 1 Evaluation: Server-delivered visible text vs Client-rendered visible text (Blocker E)
 * Tests individual product facts on accessible visible body text without JS,
 * verifying that hidden content (hidden attribute, display:none, scripts, comments) is rejected.
 */
function evaluateDefect1(noJsDomData, renderedDomData) {
  const noJsVisibleText = noJsDomData.visibleBodyText || '';
  const renderedVisibleText = renderedDomData.visibleBodyText || '';

  // Element visibility check: #product-content must not be hidden
  const isContentHidden = noJsDomData.productContentVisibility && !noJsDomData.productContentVisibility.isVisible && noJsDomData.productContentVisibility.exists;

  const factsToTest = [
    { name: 'Product Title', token: 'Radiant Barrier Defense Serum' },
    { name: 'Visible Price', token: '$38.00' },
    { name: 'Product SKU', token: 'AB-RDS-050' },
    { name: 'Primary Active (Niacinamide)', token: '2% Niacinamide' },
    { name: 'Secondary Active (Ceramide NP)', token: 'Ceramide NP' },
    { name: 'INCI Formulation Base', token: 'Aqua (Water)' }
  ];

  const factResults = factsToTest.map(f => {
    // If container is hidden via display:none or hidden attr, facts cannot pass
    const inNoJs = !isContentHidden && noJsVisibleText.includes(f.token);
    const inRendered = renderedVisibleText.includes(f.token);
    return {
      name: f.name,
      token: f.token,
      foundInNoJsVisibleText: inNoJs,
      foundInRenderedVisibleText: inRendered
    };
  });

  const rawPassedCount = factResults.filter(f => f.foundInNoJsVisibleText).length;
  const renderedPassedCount = factResults.filter(f => f.foundInRenderedVisibleText).length;

  const rawMissingFacts = factResults.filter(f => !f.foundInNoJsVisibleText);
  const rawCoveragePercent = Math.round((rawPassedCount / factsToTest.length) * 100);
  const renderedCoveragePercent = Math.round((renderedPassedCount / factsToTest.length) * 100);

  const errors = [];
  if (isContentHidden) {
    errors.push('Product container (#product-content) is hidden from users (display:none or hidden attribute).');
  }
  if (rawMissingFacts.length > 0) {
    errors.push(`Missing facts in server-delivered visible text (${rawMissingFacts.length}/${factsToTest.length}): ${rawMissingFacts.map(f => f.name).join(', ')}.`);
  }

  // Status must be dynamically derived: pass only if ALL individual facts exist in server-delivered visible text
  const pass = (rawMissingFacts.length === 0 && !isContentHidden);

  return {
    pass,
    status: pass ? 'PASS' : 'FAIL',
    defectName: 'Defect 1: Raw HTML Product Information (Client-Side Rendering Defect)',
    factResults,
    isContentHidden,
    rawCoveragePercent,
    renderedCoveragePercent,
    rawPassedCount,
    renderedPassedCount,
    totalFactsTested: factsToTest.length,
    rawMissingFacts: rawMissingFacts.map(f => f.name),
    errors,
    noJsVisibleSnippet: noJsVisibleText.slice(0, 300).replace(/\s+/g, ' ') + '...'
  };
}

/**
 * Defect 2 Evaluation: Schema.org Product Structured Data (Blocker C, D)
 * Evaluates all JSON-LD blocks on the page (both raw HTML and rendered DOM).
 */
function evaluateDefect2(rawHtml, visibleFacts, renderedJsonLdBlocks = null) {
  const rawBlocks = extractAllJsonLdBlocks(rawHtml);
  const rawValidation = validateProductSchema(rawBlocks, visibleFacts);

  let combinedErrors = [...rawValidation.errors];
  let combinedWarnings = [...rawValidation.warnings];
  let renderedValidation = null;

  if (renderedJsonLdBlocks && Array.isArray(renderedJsonLdBlocks)) {
    renderedValidation = validateProductSchema(renderedJsonLdBlocks, visibleFacts);

    // Check for JavaScript-induced changes between raw and rendered JSON-LD
    const rawNormalized = rawBlocks.map(b => b.trim());
    const renderedNormalized = renderedJsonLdBlocks.map(b => b.trim());

    if (rawNormalized.length !== renderedNormalized.length || !rawNormalized.every((b, i) => b === renderedNormalized[i])) {
      combinedErrors.push('JavaScript client DOM modified or injected JSON-LD structured data (rendered blocks differ from server-delivered HTML).');
    }

    // Include any errors detected in the rendered JSON-LD blocks
    renderedValidation.errors.forEach(err => {
      if (!combinedErrors.includes(err)) {
        combinedErrors.push(`Rendered DOM structured data error: ${err}`);
      }
    });
  }

  const allBlocksToReport = renderedValidation ? renderedValidation.parsedBlocks : rawValidation.parsedBlocks;
  const productNodesFound = renderedValidation ? Math.max(rawValidation.productNodes.length, renderedValidation.productNodes.length) : rawValidation.productNodes.length;
  const offersCheckedCount = renderedValidation ? Math.max(rawValidation.offersChecked.length, renderedValidation.offersChecked.length) : rawValidation.offersChecked.length;

  const pass = combinedErrors.length === 0;

  return {
    pass,
    status: pass ? 'PASS' : 'FAIL',
    defectName: 'Defect 2: Product Structured Data (Schema.org JSON-LD)',
    hasJsonLd: rawBlocks.length > 0 || (renderedJsonLdBlocks && renderedJsonLdBlocks.length > 0),
    jsonLdBlocksCount: rawBlocks.length,
    renderedJsonLdBlocksCount: renderedJsonLdBlocks ? renderedJsonLdBlocks.length : rawBlocks.length,
    schemaOrgSyntaxValid: rawValidation.schemaOrgSyntaxValid && (!renderedValidation || renderedValidation.schemaOrgSyntaxValid),
    visibleContentConsistent: rawValidation.visibleContentConsistent && (!renderedValidation || renderedValidation.visibleContentConsistent),
    localSchemaValidationPassed: pass,
    productNodesFound,
    offersCheckedCount,
    errors: combinedErrors,
    warnings: combinedWarnings,
    parsedBlocks: allBlocksToReport,
    disclaimer: rawValidation.disclaimer
  };
}

/**
 * Defect 3 Evaluation: Canonical & Robots Indexability Directives (Blocker F)
 */
function evaluateDefect3(rawHttpResponse, noJsDomData, renderedDomData, expectedCanonical = 'https://demo.aurabotanica.example/products/radiant-barrier-serum') {
  const rawHtml = rawHttpResponse.rawHtml || '';
  const rawHeaders = rawHttpResponse.headers || {};

  const errors = [];

  // Extract from raw HTML
  const rawRobotsList = extractMetaDirectivesFromRawHtml(rawHtml, 'robots');
  const rawGooglebotList = extractMetaDirectivesFromRawHtml(rawHtml, 'googlebot');
  const rawCanonicalList = extractCanonicalsFromRawHtml(rawHtml);

  // Extract from DOM
  const noJsRobotsList = noJsDomData.robotsMetaList || [];
  const noJsGooglebotList = noJsDomData.googlebotMetaList || [];
  const noJsCanonicalList = noJsDomData.canonicalList || [];

  const renderedRobotsList = renderedDomData.robotsMetaList || [];
  const renderedGooglebotList = renderedDomData.googlebotMetaList || [];
  const renderedCanonicalList = renderedDomData.canonicalList || [];

  // 1. Inspect X-Robots-Tag HTTP Header (case-insensitive)
  let xRobotsTag = null;
  for (const [key, val] of Object.entries(rawHeaders)) {
    if (key.toLowerCase() === 'x-robots-tag') {
      xRobotsTag = val;
      break;
    }
  }

  if (xRobotsTag) {
    const xVal = String(xRobotsTag).toLowerCase();
    if (xVal.includes('noindex')) {
      errors.push(`HTTP header 'X-Robots-Tag' contains noindex directive: "${xRobotsTag}".`);
    }
    if (xVal.includes('none')) {
      errors.push(`HTTP header 'X-Robots-Tag' contains 'none' directive (implies noindex, nofollow): "${xRobotsTag}".`);
    }
  }

  // 2. Check Robots Meta Directives (Attribute-Order-Agnostic, handling 'none')
  rawRobotsList.forEach(directivesStr => {
    const lower = directivesStr.toLowerCase();
    const tokens = lower.split(/[\s,]+/).map(t => t.trim()).filter(Boolean);
    if (tokens.includes('noindex') || lower.includes('noindex')) {
      errors.push(`Raw HTML meta[name="robots"] contains indexing blocker: "${directivesStr}".`);
    }
    if (tokens.includes('none') || lower.includes('none')) {
      errors.push(`Raw HTML meta[name="robots"] contains 'none' directive (implies noindex, nofollow): "${directivesStr}".`);
    }
    if (tokens.includes('index') && tokens.includes('noindex')) {
      errors.push(`Raw HTML meta[name="robots"] contains conflicting indexing directives: "${directivesStr}".`);
    }
  });

  // 3. Check Googlebot-Specific Directives (Handling 'none')
  rawGooglebotList.forEach(directivesStr => {
    const lower = directivesStr.toLowerCase();
    if (lower.includes('noindex')) {
      errors.push(`Raw HTML meta[name="googlebot"] contains Googlebot-specific noindex blocker: "${directivesStr}".`);
    }
    if (lower.includes('none')) {
      errors.push(`Raw HTML meta[name="googlebot"] contains Googlebot 'none' directive (implies noindex, nofollow): "${directivesStr}".`);
    }
  });

  // 4. Check Multiple or Conflicting Canonical Links in Raw HTML
  if (rawCanonicalList.length === 0) {
    errors.push('Missing canonical link (<link rel="canonical">) in raw HTML.');
  } else if (rawCanonicalList.length > 1) {
    errors.push(`Multiple canonical link elements detected in raw HTML (${rawCanonicalList.length} found): ${JSON.stringify(rawCanonicalList)}.`);
  } else {
    const rawCanonical = rawCanonicalList[0];
    if (rawCanonical.startsWith('/')) {
      errors.push(`Canonical URL is relative ("${rawCanonical}"); absolute URL required.`);
    }
    if (rawCanonical.startsWith('http://')) {
      errors.push(`Canonical URL uses insecure HTTP protocol ("${rawCanonical}").`);
    }
    if (rawCanonical !== expectedCanonical) {
      errors.push(`Canonical URL mismatch: expected simulated production URL "${expectedCanonical}", found "${rawCanonical}".`);
    }
  }

  // 5. Detect Client-Side JavaScript Directive Mutations
  // A) JS inserted googlebot or robots noindex/none
  renderedRobotsList.forEach(r => {
    const lower = r.toLowerCase();
    if ((lower.includes('noindex') || lower.includes('none')) && !rawRobotsList.some(rawR => rawR.toLowerCase().includes('noindex') || rawR.toLowerCase().includes('none'))) {
      errors.push(`JavaScript client DOM mutated robots meta to indexing blocker: "${r}".`);
    }
  });
  renderedGooglebotList.forEach(g => {
    const lower = g.toLowerCase();
    if ((lower.includes('noindex') || lower.includes('none')) && !rawGooglebotList.some(rawG => rawG.toLowerCase().includes('noindex') || rawG.toLowerCase().includes('none'))) {
      errors.push(`JavaScript client DOM inserted Googlebot noindex blocker: "${g}".`);
    }
  });

  // B) JS removed canonical link
  if (rawCanonicalList.length >= 1 && renderedCanonicalList.length === 0) {
    errors.push('Canonical link removed by JavaScript in rendered DOM.');
  }

  // C) JS changed canonical URL
  if (rawCanonicalList.length === 1 && renderedCanonicalList.length === 1) {
    if (rawCanonicalList[0] !== renderedCanonicalList[0]) {
      errors.push(`Canonical mismatch between server HTML ("${rawCanonicalList[0]}") and rendered DOM ("${renderedCanonicalList[0]}").`);
    }
  }

  // D) Multiple canonicals created in rendered DOM
  if (renderedCanonicalList.length > 1) {
    errors.push(`Multiple canonical link elements detected in rendered DOM (${renderedCanonicalList.length} found).`);
  }

  const pass = (errors.length === 0);

  return {
    pass,
    status: pass ? 'PASS' : 'FAIL',
    defectName: 'Defect 3: Canonical & Indexability Directives',
    rawRobotsList,
    rawGooglebotList,
    xRobotsTag,
    rawCanonicalList,
    renderedCanonicalList,
    expectedCanonical,
    errors
  };
}

module.exports = {
  fetchRawHttpResponse,
  fetchNoJsDom,
  fetchRenderedDom,
  extractAllJsonLdBlocks,
  extractMetaDirectivesFromRawHtml,
  extractCanonicalsFromRawHtml,
  evaluateDefect1,
  evaluateDefect2,
  evaluateDefect3
};
