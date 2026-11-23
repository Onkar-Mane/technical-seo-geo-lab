/**
 * Aura Botanica - Client-side Product Loader (Baseline)
 * Simulates a client-side rendered Single-Page Application (SPA) / headless storefront
 * where critical product information is injected dynamically via JavaScript after page load.
 */
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("client-product-container");
  if (!container) return;

  // Simulate network/rendering delay typical in client-side architectures
  setTimeout(() => {
    container.innerHTML = `
      <div class="product-meta-header">
        <div class="category-breadcrumbs">Skincare / Facial Serums</div>
        <h1 class="product-title" id="visible-title">Radiant Barrier Defense Serum</h1>
        <div class="price-row">
          <span class="price-value" id="visible-price">$38.00 USD</span>
          <span class="sku-tag" id="visible-sku">SKU: AB-RDS-050</span>
          <span class="availability-tag">In Stock (Demonstration Inventory)</span>
        </div>
      </div>

      <div class="product-description-container">
        <h2 class="section-title">Formulation Overview</h2>
        <p class="product-description" id="visible-description">
          A restorative botanical facial serum formulated with 2% niacinamide, ceramide complex, 
          and multi-molecular hyaluronic acid to hydrate and protect the skin barrier against environmental stressors.
        </p>

        <h2 class="section-title">Active Ingredients</h2>
        <div class="ingredients-list" id="visible-ingredients">
          <strong>Key Actives:</strong> 2% Niacinamide (Vitamin B3), Ceramide NP, Ceramide AP, Sodium Hyaluronate.<br>
          <strong>Full INCI:</strong> Aqua (Water), Glycerin, Niacinamide, Squalane, Ceramide NP, Ceramide AP, 
          Sodium Hyaluronate, Tocopherol, Xanthan Gum, Phenoxyethanol, Ethylhexylglycerin.
        </div>

        <h2 class="section-title">Formulation Specifications (Demonstration Model)</h2>
        <ul class="benefits-list" id="visible-benefits">
          <li>Formulated with humectants and ceramides for barrier hydration (demonstration specification).</li>
          <li>Provides multi-depth moisture retention with balanced humectants and emollients.</li>
          <li>Formulated without synthetic fragrance, essential oils, or artificial colorants.</li>
        </ul>

        <h2 class="section-title">Application Guidelines</h2>
        <p class="product-description" id="visible-usage">
          Dispense 2 to 3 drops onto clean, damp skin morning and night. Gently press into face and neck before applying heavier moisturizers.
        </p>

        <table class="specs-table">
          <tr><td>Net Volume</td><td>50 ml / 1.7 fl. oz.</td></tr>
          <tr><td>Skin Compatibility</td><td>Sensitive, Dry, Combination, Barrier-Compromised</td></tr>
          <tr><td>Target pH Range</td><td>5.2 - 5.5</td></tr>
        </table>

        <button class="cta-button" disabled>DEMONSTRATION SAMPLE — NOT FOR SALE</button>
      </div>
    `;
  }, 100);
});
