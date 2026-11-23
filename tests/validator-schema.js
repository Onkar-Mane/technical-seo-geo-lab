/**
 * Schema.org Product & Offer Programmatic Validator
 * 
 * Evaluates:
 * 1. Schema.org syntax validity across all JSON-LD blocks
 * 2. Strict factual consistency with visible rendered DOM facts
 * 3. Detection of multiple Product conflicts and conflicting Offer entries
 * 4. Exact product description alignment under documented normalization
 * 
 * DISCLAIMER: Local structured-data validation certifies only that the fields
 * checked conform to Schema.org standards and match visible DOM facts. It does not
 * certify official Google rich-result eligibility, which requires external Google validation.
 */

/**
 * Normalizes text for comparison:
 * Decodes HTML entities, collapses whitespace, removes surrounding/curved quotes, trims.
 */
function decodeHtmlEntities(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function normalizeText(str) {
  if (!str || typeof str !== 'string') return '';
  return decodeHtmlEntities(str)
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/["“”'‘’]/g, '')
    .trim();
}

/**
 * Normalizes SKU string:
 * Removes leading "SKU:", uppercase, whitespace collapsed.
 */
function normalizeSku(sku) {
  if (!sku || typeof sku !== 'string') return '';
  return sku
    .replace(/^SKU\s*:\s*/i, '')
    .replace(/\s+/g, '')
    .trim()
    .toUpperCase();
}

/**
 * Checks if a Schema.org type matches "Product" (handles string or array of types, and Schema.org URIs).
 */
function isProductType(type) {
  if (!type) return false;
  if (typeof type === 'string') {
    const clean = type.replace(/^https?:\/\/schema\.org\//i, '').trim();
    return clean === 'Product';
  }
  if (Array.isArray(type)) {
    return type.some(t => isProductType(t));
  }
  return false;
}

/**
 * Normalizes availability strings to canonical Schema.org enum values.
 * Returns 'InStock', 'OutOfStock', 'PreOrder', or 'UNRECOGNIZED'.
 */
function normalizeAvailability(availStr) {
  if (!availStr || typeof availStr !== 'string') return null;
  const s = availStr.toLowerCase().trim();
  if (s.includes('in stock') || s.includes('instock') || s.includes('in_stock')) {
    return 'InStock';
  }
  if (
    s.includes('out of stock') ||
    s.includes('outofstock') ||
    s.includes('out_of_stock') ||
    s.includes('sold out') ||
    s.includes('currently unavailable') ||
    s.includes('unavailable')
  ) {
    return 'OutOfStock';
  }
  if (s.includes('preorder') || s.includes('pre-order') || s.includes('pre_order')) {
    return 'PreOrder';
  }
  return 'UNRECOGNIZED';
}

/**
 * Extracts all nodes from a parsed JSON-LD entity by recursively walking all properties and arrays.
 * Handles direct objects, arrays, @graph, mainEntity, about, itemReviewed, etc.
 */
function extractAllNodes(parsed) {
  const nodes = [];
  const visited = new Set();
  function traverse(item) {
    if (!item || typeof item !== 'object') return;
    if (visited.has(item)) return;
    visited.add(item);
    if (Array.isArray(item)) {
      item.forEach(traverse);
    } else {
      nodes.push(item);
      for (const key of Object.keys(item)) {
        if (item[key] && typeof item[key] === 'object') {
          traverse(item[key]);
        }
      }
    }
  }
  traverse(parsed);
  return nodes;
}

/**
 * Validates JSON-LD input against Schema.org Product specifications and visible DOM facts.
 * 
 * @param {string|string[]} jsonInput - Single JSON-LD string or array of JSON-LD script block strings
 * @param {object} visibleFacts - Observable facts extracted from the rendered DOM
 * @returns {object} Detailed validation result with distinct claims
 */
function validateProductSchema(jsonInput, visibleFacts = {}) {
  const result = {
    valid: false,
    schemaOrgSyntaxValid: false,
    visibleContentConsistent: false,
    localSchemaValidationPassed: false,
    errors: [],
    warnings: [],
    parsedBlocks: [],
    productNodes: [],
    offersChecked: [],
    disclaimer: "Local structured-data validation passed for the fields checked. Official Google rich-result eligibility requires testing via Google's official Rich Results Test."
  };

  // Normalize input into an array of raw block strings
  let rawBlocks = [];
  if (Array.isArray(jsonInput)) {
    rawBlocks = jsonInput;
  } else if (typeof jsonInput === 'string') {
    rawBlocks = [jsonInput];
  } else {
    result.errors.push('No JSON-LD input provided or invalid input format.');
    return result;
  }

  // Filter out completely empty blocks
  rawBlocks = rawBlocks.filter(b => b && typeof b === 'string' && b.trim() !== '');

  if (rawBlocks.length === 0) {
    result.errors.push('Missing Schema.org Product structured data: no JSON-LD script content provided.');
    return result;
  }

  const syntaxErrors = [];
  const consistencyErrors = [];
  const parsedObjects = [];

  // 1. Parse each block independently; reject any malformed JSON-LD block
  rawBlocks.forEach((blockStr, bIdx) => {
    try {
      const parsed = JSON.parse(blockStr.trim());
      parsedObjects.push({ blockIndex: bIdx, parsed });
      result.parsedBlocks.push(parsed);
    } catch (err) {
      syntaxErrors.push(`JSON parsing error in JSON-LD block #${bIdx + 1}: ${err.message}`);
    }
  });

  // If any block is malformed JSON, record syntax failure
  if (syntaxErrors.length > 0) {
    result.errors = [...syntaxErrors];
    result.valid = false;
    return result;
  }

  // 2. Collect all nodes across all blocks
  const allNodes = [];
  parsedObjects.forEach(({ blockIndex, parsed }) => {
    const nodes = extractAllNodes(parsed);
    nodes.forEach(node => allNodes.push({ blockIndex, node }));
  });

  // 3. Filter for Product nodes (Do not flag unrelated schema nodes like Organization or WebSite)
  const productEntries = allNodes.filter(({ node }) => node && isProductType(node['@type']));

  if (productEntries.length === 0) {
    syntaxErrors.push("Missing '@type': 'Product'. No Product entity found in structured data.");
    result.errors = [...syntaxErrors];
    result.valid = false;
    return result;
  }

  result.productNodes = productEntries.map(e => e.node);

  // 4. Validate Context for all Product nodes
  productEntries.forEach(({ blockIndex, node }, pIdx) => {
    const context = node['@context'] || (parsedObjects[blockIndex] && parsedObjects[blockIndex].parsed['@context']);
    if (!context) {
      syntaxErrors.push(`Product node #${pIdx + 1} (Block #${blockIndex + 1}) is missing '@context'.`);
    } else if (!/schema\.org/i.test(String(context))) {
      syntaxErrors.push(`Product node #${pIdx + 1} has invalid '@context': expected schema.org, found "${context}".`);
    }
  });

  // 5. Detect Conflicting Product Nodes or Unsupported Multi-Product Structures (Blocker C, U03)
  if (productEntries.length > 1) {
    const firstProd = productEntries[0].node;
    for (let i = 1; i < productEntries.length; i++) {
      const otherProd = productEntries[i].node;
      const skuDiffers = firstProd.sku && otherProd.sku && normalizeSku(firstProd.sku) !== normalizeSku(otherProd.sku);
      if (skuDiffers) {
        consistencyErrors.push(
          `UNSUPPORTED: Multi-product page structures are unsupported in this test harness. Found secondary Product "${otherProd.name || 'unknown'}" (SKU: ${otherProd.sku || 'none'}).`
        );
      } else {
        if (firstProd.name && otherProd.name && firstProd.name.trim() !== otherProd.name.trim()) {
          consistencyErrors.push(
            `Conflicting Product nodes detected: Product node #1 has name "${firstProd.name.trim()}" while Product node #${i + 1} has name "${otherProd.name.trim()}".`
          );
        }
        if (firstProd.description && otherProd.description && normalizeText(firstProd.description) !== normalizeText(otherProd.description)) {
          consistencyErrors.push(
            `Conflicting Product nodes detected: Product node #1 has description mismatch with Product node #${i + 1}.`
          );
        }
      }
    }
  }

  // 6. Validate Each Product Node's Core Properties Against Visible Facts
  productEntries.forEach(({ blockIndex, node }, pIdx) => {
    const label = `Product node #${pIdx + 1} (Block #${blockIndex + 1})`;

    // Name Validation
    if (!node.name || typeof node.name !== 'string' || node.name.trim() === '') {
      syntaxErrors.push(`${label} is missing a non-empty 'name' property.`);
    } else {
      if (!visibleFacts.title || visibleFacts.title.trim() === '') {
        consistencyErrors.push(`Missing observable fact: visible page title is empty or not found in DOM.`);
      } else if (normalizeText(node.name) !== normalizeText(visibleFacts.title)) {
        consistencyErrors.push(
          `Discrepancy: ${label} name ("${node.name.trim()}") does not match visible title ("${visibleFacts.title.trim()}").`
        );
      }
    }

    // Exact Description Validation (Blocker B)
    if (!node.description || typeof node.description !== 'string' || node.description.trim() === '') {
      syntaxErrors.push(`${label} is missing a non-empty 'description' property.`);
    } else {
      const normJsonDesc = normalizeText(node.description);

      // Reject incomplete or one-character descriptions
      if (normJsonDesc.length < 20) {
        consistencyErrors.push(
          `Invalid description: ${label} description is incomplete or too short (${normJsonDesc.length} characters: "${node.description}").`
        );
      } else if (!visibleFacts.description || visibleFacts.description.trim() === '') {
        consistencyErrors.push("Missing observable fact: visible product description is empty or not found in DOM.");
      } else {
        const normVisDesc = normalizeText(visibleFacts.description);

        // Documented Normalization Policy:
        // The normalized JSON-LD description must match the normalized visible description field extracted from the DOM.
        // We reject unrelated descriptions, one-character descriptions, and descriptions with unsupported claims.
        if (normJsonDesc.toLowerCase() !== normVisDesc.toLowerCase()) {
          // Reject if not an exact normalized match
          consistencyErrors.push(
            `Discrepancy: ${label} description does not match visible product description under documented normalization policy. (Comparison policy: complete visible description field matching under whitespace and quote normalization).`
          );
        }
      }
    }

    // SKU Validation (Exact Normalized Comparison)
    if (!node.sku || typeof node.sku !== 'string' || node.sku.trim() === '') {
      syntaxErrors.push(`${label} is missing a valid 'sku' property.`);
    } else {
      if (!visibleFacts.sku || visibleFacts.sku.trim() === '') {
        consistencyErrors.push("Missing observable fact: visible SKU is empty or not found in DOM.");
      } else {
        const normJsonSku = normalizeSku(node.sku);
        const normVisSku = normalizeSku(visibleFacts.sku);
        if (normJsonSku !== normVisSku) {
          consistencyErrors.push(
            `Discrepancy: ${label} SKU ("${normJsonSku}") does not match visible normalized SKU ("${normVisSku}").`
          );
        }
      }
    }

    // Fabricated Rating Check
    if (node.aggregateRating) {
      if (!visibleFacts.hasVisibleReviews) {
        consistencyErrors.push(
          `Fabricated / Unsupported Data: ${label} includes 'aggregateRating', but no visible customer reviews exist on the page (violates structured data policies against fabricated social proof).`
        );
      }
    }
    if (node.review) {
      if (!visibleFacts.hasVisibleReviews) {
        consistencyErrors.push(
          `Fabricated / Unsupported Data: ${label} includes 'review', but no visible customer reviews exist on the page.`
        );
      }
    }
  });

  // 7. Collect and Validate All Offers Across All Product Nodes (Blocker C, U05)
  const allOffers = [];
  productEntries.forEach(({ blockIndex, node }, pIdx) => {
    if (!node.offers) {
      syntaxErrors.push(`Product node #${pIdx + 1} (Block #${blockIndex + 1}) is missing mandatory commercial property 'offers'.`);
    } else {
      const offerList = Array.isArray(node.offers) ? node.offers : [node.offers];
      offerList.forEach((offer, oIdx) => {
        if (offer && typeof offer === 'object') {
          const oType = offer['@type'];
          if (oType === 'AggregateOffer' || (Array.isArray(oType) && oType.includes('AggregateOffer'))) {
            consistencyErrors.push(
              `UNSUPPORTED: AggregateOffer structures are unsupported in this test harness.`
            );
          }
        }
        allOffers.push({
          productIndex: pIdx,
          blockIndex,
          offerIndex: oIdx,
          offer
        });
      });
    }
  });

  result.offersChecked = allOffers.map(o => o.offer);

  // Detect Conflicting Offers Across All Collected Offers
  if (allOffers.length > 1) {
    const firstOffer = allOffers[0].offer;
    for (let i = 1; i < allOffers.length; i++) {
      const otherOffer = allOffers[i].offer;
      if (firstOffer.price !== undefined && otherOffer.price !== undefined && String(firstOffer.price) !== String(otherOffer.price)) {
        consistencyErrors.push(
          `Conflicting offer prices detected across structured data offers: ${firstOffer.price} (Offer #1) vs ${otherOffer.price} (Offer #${i + 1}).`
        );
      }
      if (firstOffer.priceCurrency && otherOffer.priceCurrency && firstOffer.priceCurrency.trim().toUpperCase() !== otherOffer.priceCurrency.trim().toUpperCase()) {
        consistencyErrors.push(
          `Conflicting offer currencies detected across structured data offers: "${firstOffer.priceCurrency}" (Offer #1) vs "${otherOffer.priceCurrency}" (Offer #${i + 1}).`
        );
      }
      if (firstOffer.availability && otherOffer.availability && firstOffer.availability.trim() !== otherOffer.availability.trim()) {
        consistencyErrors.push(
          `Conflicting offer availability detected across structured data offers: "${firstOffer.availability}" (Offer #1) vs "${otherOffer.availability}" (Offer #${i + 1}).`
        );
      }
    }
  }

  // Validate Each Offer
  allOffers.forEach(({ productIndex, blockIndex, offerIndex, offer }) => {
    const label = `Offer #${offerIndex + 1} on Product #${productIndex + 1}`;

    if (!offer || typeof offer !== 'object') {
      syntaxErrors.push(`${label} must be a valid object.`);
      return;
    }

    if (offer['@type'] !== 'Offer') {
      if (offer['@type'] !== 'AggregateOffer') {
        syntaxErrors.push(`${label} has invalid '@type': expected "Offer", found "${offer['@type']}".`);
      }
    }

    // Price Numeric Validation (U06)
    if (offer.price === undefined || offer.price === null || offer.price === '') {
      if (offer['@type'] !== 'AggregateOffer') {
        syntaxErrors.push(`${label} is missing 'price' property.`);
      }
    } else if (typeof offer.price === 'string' && /[^\d.]/.test(offer.price.trim())) {
      syntaxErrors.push(`Invalid 'price' on ${label}: "${offer.price}" contains non-numeric characters.`);
    } else {
      const priceNum = parseFloat(offer.price);
      if (isNaN(priceNum) || priceNum <= 0) {
        syntaxErrors.push(`Invalid 'price' on ${label}: "${offer.price}" is not a positive number.`);
      } else {
        if (!visibleFacts.price || visibleFacts.price.trim() === '') {
          consistencyErrors.push(`Missing observable fact: visible price is empty or not found in DOM.`);
        } else {
          const visPriceMatch = visibleFacts.price.match(/[\d]+(?:\.[\d]{2})?/);
          if (!visPriceMatch) {
            consistencyErrors.push(`Cannot parse numeric price from visible price text ("${visibleFacts.price}").`);
          } else {
            const visPriceNum = parseFloat(visPriceMatch[0]);
            if (Math.abs(priceNum - visPriceNum) > 0.001) {
              consistencyErrors.push(
                `Discrepancy: Structured data price (${priceNum.toFixed(2)}) on ${label} does not match visible price (${visPriceNum.toFixed(2)} from "${visibleFacts.price}").`
              );
            }
          }
        }
      }
    }

    // Check nested priceSpecification (U07)
    if (offer.priceSpecification && typeof offer.priceSpecification === 'object') {
      const ps = offer.priceSpecification;
      if (ps.price !== undefined) {
        const psNum = parseFloat(ps.price);
        if (!isNaN(psNum) && visibleFacts.price) {
          const visPriceMatch = visibleFacts.price.match(/[\d]+(?:\.[\d]{2})?/);
          if (visPriceMatch) {
            const visPriceNum = parseFloat(visPriceMatch[0]);
            if (Math.abs(psNum - visPriceNum) > 0.001) {
              consistencyErrors.push(
                `Discrepancy: Structured data priceSpecification price (${psNum.toFixed(2)}) on ${label} does not match visible price (${visPriceNum.toFixed(2)} from "${visibleFacts.price}").`
              );
            }
          }
        }
      }
    }

    // Currency Validation
    if (!offer.priceCurrency || typeof offer.priceCurrency !== 'string') {
      if (offer['@type'] !== 'AggregateOffer') {
        syntaxErrors.push(`${label} is missing 'priceCurrency' property.`);
      }
    } else if (!/^[A-Z]{3}$/.test(offer.priceCurrency.trim())) {
      syntaxErrors.push(`Invalid 'priceCurrency' on ${label}: "${offer.priceCurrency}" is not a valid 3-letter uppercase ISO 4217 code.`);
    } else {
      // Match with visible currency
      if (visibleFacts.price) {
        let expectedCur = null;
        if (visibleFacts.price.includes('USD') || visibleFacts.price.includes('$')) expectedCur = 'USD';
        else if (visibleFacts.price.includes('EUR') || visibleFacts.price.includes('€')) expectedCur = 'EUR';
        else if (visibleFacts.price.includes('GBP') || visibleFacts.price.includes('£')) expectedCur = 'GBP';

        if (expectedCur && offer.priceCurrency.trim().toUpperCase() !== expectedCur) {
          consistencyErrors.push(
            `Discrepancy: Structured data currency ("${offer.priceCurrency}") on ${label} does not match displayed currency ("${expectedCur}").`
          );
        }
      }
    }

    // Availability Validation (N06, U08)
    if (!offer.availability) {
      if (offer['@type'] !== 'AggregateOffer') {
        result.warnings.push(`${label} is missing recommended 'availability' property.`);
      }
    } else {
      if (!offer.availability.includes('schema.org/')) {
        syntaxErrors.push(`'availability' on ${label} must be a valid Schema.org URI, found "${offer.availability}".`);
      }
      if (visibleFacts.availability) {
        const normVisAvail = normalizeAvailability(visibleFacts.availability);
        if (normVisAvail === 'UNRECOGNIZED') {
          consistencyErrors.push(
            `UNSUPPORTED: Unrecognized visible availability wording "${visibleFacts.availability}".`
          );
        } else if (normVisAvail) {
          const normJsonAvail = offer.availability ? normalizeAvailability(offer.availability) : null;
          if (normJsonAvail && normJsonAvail !== normVisAvail) {
            consistencyErrors.push(
              `Discrepancy: Visible text indicates ${normVisAvail} ("${visibleFacts.availability.trim()}"), but structured data on ${label} specifies "${offer.availability}".`
            );
          }
        }
      }
    }
  });

  // Deduplicate errors
  result.errors = Array.from(new Set([...syntaxErrors, ...consistencyErrors]));

  result.schemaOrgSyntaxValid = (syntaxErrors.length === 0);
  result.visibleContentConsistent = (consistencyErrors.length === 0);
  result.localSchemaValidationPassed = (result.errors.length === 0);
  result.valid = result.localSchemaValidationPassed;

  return result;
}

module.exports = {
  validateProductSchema,
  normalizeText,
  normalizeSku
};
