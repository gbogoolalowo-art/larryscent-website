document.addEventListener("DOMContentLoaded", () => {
  const menuButton = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".site-nav");

  if (menuButton && nav) {
    menuButton.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");
      menuButton.setAttribute("aria-expanded", String(isOpen));
    });
  }

  updateCartCount();
  productsReady.then(() => {
    if (productsSource === "firebase") Cart.pruneMissing();
    updateCartCount();
    renderHomeProducts();
    renderShopProducts();
  });

  document.addEventListener("click", event => {
    const addButton = event.target.closest("[data-add-to-cart]");
    if (addButton) {
      const id = Number(addButton.dataset.addToCart);
      const product = products.find(item => item.id === id);
      if (!product || isSoldOut(product)) return;
      const inBag = Cart.getItems().find(item => item.productId === id)?.quantity || 0;
      if (typeof product.stock === "number" && inBag >= product.stock) {
        addButton.textContent = "All in your bag";
      } else {
        Cart.add(id);
        updateCartCount();
        addButton.textContent = "Added!";
      }
      setTimeout(() => addButton.textContent = "Add to bag", 1200);
    }
  });

  const newsletter = document.querySelector("#newsletter-form");
  if (newsletter) {
    newsletter.addEventListener("submit", event => {
      event.preventDefault();
      const message = document.querySelector("#newsletter-message");
      if (message) message.textContent = "Thank you for subscribing!";
      newsletter.reset();
    });
  }

  const contactForm = document.querySelector("#contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", event => {
      event.preventDefault();
      document.querySelector("#contact-message").textContent =
        "Thank you. This demo form is ready to be connected to an email service.";
      contactForm.reset();
    });
  }

  const search = document.querySelector("#product-search");
  const category = document.querySelector("#category-filter");
  const sort = document.querySelector("#sort-products");
  [search, category, sort].forEach(control => {
    if (control) control.addEventListener("input", renderShopProducts);
    if (control) control.addEventListener("change", renderShopProducts);
  });
});

function updateCartCount() {
  const count = document.querySelector("#cart-count");
  if (count) count.textContent = Cart.count();
}

function productCard(product) {
  const url = `pages/product-details.html?id=${product.id}`;
  const action = isSoldOut(product)
    ? `<button class="button button-small" type="button" disabled>Sold out</button>`
    : `<button class="button button-small" type="button" data-add-to-cart="${product.id}">Add to bag</button>`;
  return `
    <article class="product-card">
      <a class="product-image" href="${url}" tabindex="-1" aria-hidden="true">
        <img src="${esc(productImage(product))}" alt="" width="600" height="700" loading="lazy" data-fallback="LARRYSCENT">
      </a>
      <div class="product-info">
        <p class="product-category">${esc(categoryLabels[product.category] || product.category)}</p>
        <h3><a href="${url}">${esc(product.name)}</a></h3>
        <p class="product-size">${esc(product.size)}</p>
        <div class="product-bottom">
          <strong>${formatPrice(product.price)}</strong>
          ${action}
        </div>
      </div>
    </article>`;
}

function renderHomeProducts() {
  const container = document.querySelector("#home-products");
  if (!container) return;
  container.innerHTML = products.slice(0, 4).map(productCard).join("");
}

function renderShopProducts() {
  const container = document.querySelector("#shop-product-grid");
  if (!container) return;

  const searchTerm = (document.querySelector("#product-search")?.value || "").toLowerCase();
  const category = document.querySelector("#category-filter")?.value || "all";
  const sort = document.querySelector("#sort-products")?.value || "featured";

  let filtered = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm) &&
    (category === "all" || product.category === category)
  );

  if (sort === "low-high") filtered.sort((a, b) => a.price - b.price);
  if (sort === "high-low") filtered.sort((a, b) => b.price - a.price);
  if (sort === "name") filtered.sort((a, b) => a.name.localeCompare(b.name));

  container.innerHTML = filtered.map(productCard).join("");
  const count = document.querySelector("#result-count");
  const empty = document.querySelector("#no-products");
  if (count) count.textContent = `${filtered.length} product${filtered.length === 1 ? "" : "s"} found`;
  if (empty) empty.hidden = filtered.length !== 0;
}
