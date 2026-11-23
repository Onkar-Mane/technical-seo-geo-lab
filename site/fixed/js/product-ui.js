/**
 * Aura Botanica - Progressive Enhancement UI Script (Fixed State)
 * Core product information is 100% rendered in the server-delivered HTML.
 * This script provides non-blocking progressive enhancement when interactive elements exist.
 */
document.addEventListener("DOMContentLoaded", () => {
  // Demonstration UI initialization marker
  const container = document.getElementById("product-content");
  if (container) {
    container.dataset.uiHydrated = "true";
  }
});
