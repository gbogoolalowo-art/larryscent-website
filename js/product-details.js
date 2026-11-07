document.addEventListener("DOMContentLoaded", async () => {
  const container = document.querySelector("#product-details");
  if (!container) return;

  await productsReady;
  const id = Number(new URLSearchParams(window.location.search).get("id"));
  const product = products.find(item => item.id === id);
  const crumb = document.querySelector("#breadcrumb-name");

  if (!product) {
    document.title = "Fragrance not found | LARRYSCENT";
    if (crumb) crumb.textContent = "Not found";
    container.innerHTML = `
      <div class="empty-state">
        <h2>We couldn't find that fragrance</h2>
        <p>It may have been removed, or the link may be incorrect.</p>
        <a class="button" href="../shop.html">Back to shop</a>
      </div>`;
    return;
  }

  const summary = `${product.name}, ${product.size}. ${product.description}`;
  document.title = `${product.name} | LARRYSCENT`;
  document.querySelector('meta[name="description"]')?.setAttribute("content", summary);
  document.querySelector('meta[property="og:title"]')?.setAttribute("content", document.title);
  document.querySelector('meta[property="og:description"]')?.setAttribute("content", summary);
  if (crumb) crumb.textContent = product.name;

  const action = isSoldOut(product)
    ? `<button class="button" type="button" disabled>Sold out</button>`
    : `<button class="button" type="button" data-add-to-cart="${product.id}">Add to bag</button>`;

  container.innerHTML = `
    <div class="detail-image">
      <img src="${esc(productImage(product, "../"))}" alt="${esc(product.name)}" width="700" height="800" data-fallback="LARRYSCENT">
    </div>
    <div class="detail-copy">
      <p class="eyebrow">${esc(categoryLabels[product.category] || product.category)}</p>
      <h1>${esc(product.name)}</h1>
      <p class="detail-size">${esc(product.size)}</p>
      <h2>${formatPrice(product.price)}</h2>
      <p>${esc(product.description)}</p>
      ${action}
    </div>`;
});
