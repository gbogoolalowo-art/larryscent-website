const seedProducts = [
  { id: 1, name: "Club De Nuit Intense Man", category: "men", size: "105ml", price: 60000, image: "images/products/club-de-nuit.jpg", description: "A bold, confident fragrance with a memorable presence." },
  { id: 2, name: "Lamsat Harir", category: "women", size: "100ml", price: 20000, image: "images/products/lamsat-harir.jpg", description: "A graceful fragrance with a soft, elegant character." },
  { id: 3, name: "Tom Ford Velvet Orchid", category: "women", size: "100ml", price: 95000, image: "images/products/velvet-orchid.jpg", description: "A rich floral fragrance for special moments." },
  { id: 4, name: "Mancera Red Tobacco", category: "unisex", size: "120ml", price: 160000, image: "images/products/red-tobacco.jpg", description: "A warm, expressive scent with a distinctive character." },
  { id: 5, name: "Velvet Oud", category: "unisex", size: "100ml", price: 40000, image: "images/products/velvet-oud.jpg", description: "A smooth oud-inspired fragrance for day or evening." },
  { id: 6, name: "Hayaati Belle", category: "women", size: "100ml", price: 30000, image: "images/products/hayaati-belle.jpg", description: "A bright, charming fragrance for everyday wear." },
  { id: 7, name: "Khair Confection", category: "women", size: "100ml", price: 35000, image: "images/products/khair-confection.jpg", description: "A sweet and playful fragrance with a luxurious feel." },
  { id: 8, name: "Rayhaan Vahalla", category: "men", size: "100ml", price: 40000, image: "images/products/rayhaan-vahalla.jpg", description: "A modern fragrance made for confident style." }
];

// The live catalogue. It starts as the starter list above, and is replaced by the
// products stored in Firebase once the connection is set up (see SETUP.md).
const products = seedProducts.slice();
let productsSource = "local";

const categoryLabels = { men: "For him", women: "For her", unisex: "Unisex" };

function isSoldOut(product) {
  return typeof product.stock === "number" && product.stock <= 0;
}

// Escapes text before it is placed inside HTML.
function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]
  ));
}

// Starter images are file paths; images uploaded in the dashboard are data URLs.
function productImage(product, root = "") {
  const src = product.image || "";
  return /^(data:|https?:|\/)/.test(src) ? src : root + src;
}

const firebaseReady = import(new URL("firebase-init.js", document.currentScript.src).href)
  .catch(() => null);

const productsReady = (async function loadProducts() {
  try {
    const firebase = await firebaseReady;
    if (!firebase || !firebase.isConfigured) return;
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 8000));
    const remote = await Promise.race([firebase.fetchProducts(), timeout]);
    if (remote) {
      products.splice(0, products.length, ...remote);
      productsSource = "firebase";
    }
  } catch (error) {
    console.warn("Showing the built-in product list.", error);
  }
})();
