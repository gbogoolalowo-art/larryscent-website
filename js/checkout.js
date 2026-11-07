document.addEventListener("DOMContentLoaded", () => {
  productsReady.then(() => {
    if (productsSource === "firebase") Cart.pruneMissing();
    updateCartCount();
    renderCartPage();
    renderCheckoutPage();
  });
});

function renderCartPage() {
  const container = document.querySelector("#cart-items");
  if (!container) return;

  const items = Cart.getItems();
  if (!items.length) {
    container.innerHTML = `<div class="empty-state"><h2>Your bag is waiting</h2><p>You have not added any fragrances yet.</p><a class="button" href="../shop.html">Explore the collection</a></div>`;
  } else {
    container.innerHTML = items.map(item => {
      const product = products.find(entry => entry.id === item.productId);
      if (!product) return "";
      const max = typeof product.stock === "number" ? ` max="${product.stock}"` : "";
      return `
        <article class="cart-item">
          <img src="${esc(productImage(product, "../"))}" alt="${esc(product.name)}" width="180" height="200" data-fallback="LARRYSCENT">
          <div class="cart-item-details">
            <h3>${esc(product.name)}</h3><p>${esc(product.size)}</p>
            <strong>${formatPrice(product.price)}</strong>
            <label>Quantity
              <input class="quantity-input" type="number" min="1"${max} value="${item.quantity}" data-quantity="${product.id}">
            </label>
            <button class="text-button" type="button" data-remove="${product.id}">Remove</button>
          </div>
          <strong>${formatPrice(product.price * item.quantity)}</strong>
        </article>`;
    }).join("");
  }

  const total = document.querySelector("#cart-total");
  if (total) total.textContent = formatPrice(Cart.total());
  const count = document.querySelector("#cart-page-count");
  if (count) count.textContent = `${Cart.count()} item(s)`;
}

function renderCheckoutPage() {
  const summary = document.querySelector("#checkout-summary");
  if (!summary) return;
  const items = Cart.getItems();
  summary.innerHTML = items.map(item => {
    const product = products.find(entry => entry.id === item.productId);
    return product ? `<p><span>${esc(product.name)} × ${item.quantity}</span><strong>${formatPrice(product.price * item.quantity)}</strong></p>` : "";
  }).join("") || "<p>Your bag is empty.</p>";
  const total = document.querySelector("#checkout-total");
  if (total) total.textContent = formatPrice(Cart.total());
}

document.addEventListener("change", event => {
  if (!event.target.matches("[data-quantity]")) return;
  const product = products.find(entry => entry.id === Number(event.target.dataset.quantity));
  let quantity = Math.max(0, Math.floor(Number(event.target.value)) || 0);
  if (product && typeof product.stock === "number") quantity = Math.min(quantity, product.stock);
  Cart.updateQuantity(event.target.dataset.quantity, quantity);
  renderCartPage();
  renderCheckoutPage();
  updateCartCount();
});

document.addEventListener("click", event => {
  const removeButton = event.target.closest("[data-remove]");
  if (removeButton) {
    Cart.remove(removeButton.dataset.remove);
    renderCartPage();
    updateCartCount();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#checkout-form");
  if (!form) return;
  const message = document.querySelector("#checkout-message");
  const submit = form.querySelector('[type="submit"]');
  const say = text => { if (message) message.textContent = text; };

  form.addEventListener("submit", async event => {
    event.preventDefault();
    await productsReady;

    const items = Cart.getItems()
      .map(item => {
        const product = products.find(entry => entry.id === item.productId);
        return product ? { productId: product.id, name: product.name, size: product.size, price: product.price, quantity: item.quantity, stock: product.stock } : null;
      })
      .filter(Boolean);

    if (!items.length) return say("Your bag is empty. Add a fragrance before checking out.");
    const short = items.find(item => typeof item.stock === "number" && item.quantity > item.stock);
    if (short) return say(`Sorry, only ${short.stock} of ${short.name} left. Please update your bag.`);

    const order = {
      customer: {
        name: form.querySelector("#customer-name").value.trim(),
        email: form.querySelector("#customer-email").value.trim(),
        phone: form.querySelector("#customer-phone").value.trim(),
        address: form.querySelector("#customer-address").value.trim()
      },
      items: items.map(({ stock, ...rest }) => rest),
      total: Cart.total()
    };

    submit.disabled = true;
    say("Placing your order…");
    try {
      const firebase = await firebaseReady;
      let text;
      if (firebase && firebase.isConfigured) {
        const id = await firebase.submitOrder(order);
        text = `Thank you! Your order ${id.slice(0, 6).toUpperCase()} has been received. We will contact you to confirm your order and delivery.`;
      } else {
        text = "Thank you! This is a demonstration checkout, so no order was sent.";
      }
      Cart.clear();
      updateCartCount();
      renderCheckoutPage();
      form.reset();
      say(text);
      setTimeout(() => { window.location.href = "../shop.html"; }, 4000);
    } catch (error) {
      console.error(error);
      submit.disabled = false;
      say("Sorry, we couldn't place your order. Please try again, or contact us.");
    }
  });
});
