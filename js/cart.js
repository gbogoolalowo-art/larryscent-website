const Cart = {
  storageKey: "larryscent-cart",

  getItems() {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey)) || [];
    } catch {
      return [];
    }
  },

  save(items) {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  },

  add(productId, quantity = 1) {
    const items = this.getItems();
    const existing = items.find(item => item.productId === Number(productId));
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({ productId: Number(productId), quantity });
    }
    this.save(items);
  },

  remove(productId) {
    this.save(this.getItems().filter(item => item.productId !== Number(productId)));
  },

  updateQuantity(productId, quantity) {
    const items = this.getItems();
    const item = items.find(entry => entry.productId === Number(productId));
    if (!item) return;
    if (quantity <= 0) {
      this.remove(productId);
      return;
    }
    item.quantity = quantity;
    this.save(items);
  },

  pruneMissing() {
    this.save(this.getItems().filter(item => products.some(product => product.id === item.productId)));
  },

  clear() {
    localStorage.removeItem(this.storageKey);
  },

  count() {
    return this.getItems().reduce((sum, item) => sum + item.quantity, 0);
  },

  total() {
    return this.getItems().reduce((sum, item) => {
      const product = products.find(product => product.id === item.productId);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);
  }
};

function formatPrice(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0
  }).format(amount);
}
