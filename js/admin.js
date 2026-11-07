import { app, db, isConfigured } from "./firebase-init.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { collection, doc, getDoc, setDoc, deleteDoc, updateDoc, onSnapshot, query, orderBy, writeBatch }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const $ = (selector, root = document) => root.querySelector(selector);
const money = amount => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount || 0);
const STATUS_LABELS = { new: "New", confirmed: "Confirmed", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled" };

const state = { products: [], orders: [], editing: null, unsubscribe: [], openOrders: new Set(), loginError: "" };

/* ---------- small helpers ---------- */
let toastTimer;
function toast(text) {
  const el = $("#toast");
  el.textContent = text;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2800);
}

function confirmAction({ title, text, button }) {
  const dialog = $("#confirm-dialog");
  $("#confirm-title").textContent = title;
  $("#confirm-text").textContent = text;
  $("#confirm-dialog button[type=submit]").textContent = button;
  return new Promise(resolve => {
    dialog.returnValue = "";
    dialog.addEventListener("close", () => resolve(dialog.returnValue === "ok"), { once: true });
    dialog.showModal();
  });
}

document.addEventListener("click", event => {
  if (event.target.closest("[data-close]")) event.target.closest("dialog").close();
});

/* ---------- sign in ---------- */
if (!isConfigured) {
  $("#setup-note").hidden = false;
  $("#login-form button[type=submit]").disabled = true;
} else {
  const auth = getAuth(app);

  $("#login-form").addEventListener("submit", async event => {
    event.preventDefault();
    $("#login-error").textContent = "";
    try {
      await signInWithEmailAndPassword(auth, $("#login-email").value.trim(), $("#login-password").value);
    } catch {
      $("#login-error").textContent = "Incorrect email or password.";
    }
  });

  $("#forgot").addEventListener("click", async () => {
    const email = $("#login-email").value.trim();
    if (!email) { $("#login-error").textContent = "Enter your email above first."; return; }
    try { await sendPasswordResetEmail(auth, email); } catch { /* do not reveal whether the account exists */ }
    $("#login-error").textContent = "If that account exists, a reset email is on its way.";
  });

  $("#sign-out").addEventListener("click", () => signOut(auth));

  onAuthStateChanged(auth, async user => {
    stopListening();
    if (!user) return showLogin();
    let allowed = false;
    try { allowed = (await getDoc(doc(db, "admins", user.uid))).exists(); } catch { allowed = false; }
    if (!allowed) {
      state.loginError = "This account is not authorised to use the dashboard.";
      await signOut(auth);
      return;
    }
    $("#user-email").textContent = user.email;
    $("#login-view").hidden = true;
    $("#app").hidden = false;
    startListening();
  });
}

function showLogin() {
  $("#app").hidden = true;
  $("#login-view").hidden = false;
  $("#login-error").textContent = state.loginError;
  state.loginError = "";
  $("#login-password").value = "";
}

/* ---------- live data ---------- */
function startListening() {
  state.unsubscribe.push(onSnapshot(collection(db, "products"), snapshot => {
    state.products = snapshot.docs.map(item => item.data()).filter(item => typeof item.id === "number").sort((a, b) => a.id - b.id);
    renderProducts();
  }, () => toast("Couldn't load products. Check your rules and connection.")));

  state.unsubscribe.push(onSnapshot(query(collection(db, "orders"), orderBy("createdAt", "desc")), snapshot => {
    state.orders = snapshot.docs.map(item => ({ ...item.data(), id: item.id }));
    renderOrders();
  }, () => toast("Couldn't load orders. Check your rules and connection.")));
}
function stopListening() {
  state.unsubscribe.forEach(stop => stop());
  state.unsubscribe = [];
}

/* ---------- tabs ---------- */
document.addEventListener("click", event => {
  const tab = event.target.closest("[data-tab]");
  if (!tab) return;
  ["products", "orders"].forEach(name => {
    $("#tab-" + name).setAttribute("aria-selected", String(name === tab.dataset.tab));
    $("#panel-" + name).hidden = name !== tab.dataset.tab;
  });
});

/* ---------- products ---------- */
function stockBadge(product) {
  if (typeof product.stock !== "number") return `<span class="badge">In stock</span>`;
  if (product.stock <= 0) return `<span class="badge out">Sold out</span>`;
  if (product.stock <= 3) return `<span class="badge low">${product.stock} left</span>`;
  return `<span class="badge">${product.stock} in stock</span>`;
}

function renderProducts() {
  const body = $("#products-body");
  body.innerHTML = state.products.length
    ? state.products.map(product => `
        <tr>
          <td><img class="thumb" src="${esc(productImage(product, "../"))}" alt=""></td>
          <td><strong>${esc(product.name)}</strong><span class="sub">${esc(categoryLabels[product.category] || product.category)} · ${esc(product.size)}</span></td>
          <td>${money(product.price)}</td>
          <td>${stockBadge(product)}</td>
          <td class="actions">
            <button class="link" type="button" data-edit="${product.id}">Edit</button>
            <button class="link danger" type="button" data-delete="${product.id}">Delete</button>
          </td>
        </tr>`).join("")
    : `<tr><td class="empty" colspan="5">No products yet. Add your first perfume, or import the starter products.</td></tr>`;

  const soldOut = state.products.filter(p => typeof p.stock === "number" && p.stock <= 0).length;
  $("#product-summary").textContent = `${state.products.length} product${state.products.length === 1 ? "" : "s"}` + (soldOut ? `, ${soldOut} sold out` : "");
  $("#import-seed").hidden = state.products.length > 0;
}

$("#products-body").addEventListener("click", async event => {
  const editId = event.target.closest("[data-edit]")?.dataset.edit;
  const deleteId = event.target.closest("[data-delete]")?.dataset.delete;
  if (editId) openProductDialog(state.products.find(p => p.id === Number(editId)));
  if (deleteId) {
    const product = state.products.find(p => p.id === Number(deleteId));
    const ok = await confirmAction({ title: "Delete product?", text: `"${product.name}" will be removed from the shop. This can't be undone.`, button: "Delete" });
    if (!ok) return;
    try { await deleteDoc(doc(db, "products", String(product.id))); toast("Product deleted."); }
    catch { toast("Couldn't delete the product."); }
  }
});

$("#add-product").addEventListener("click", () => openProductDialog(null));

$("#import-seed").addEventListener("click", async () => {
  try {
    const batch = writeBatch(db);
    seedProducts.forEach(product => batch.set(doc(db, "products", String(product.id)), { ...product, stock: 10 }));
    await batch.commit();
    toast("Starter products imported. Set the real stock for each one.");
  } catch { toast("Import failed. Check your rules and connection."); }
});

const form = $("#product-form");
function openProductDialog(product) {
  state.editing = product;
  form.reset();
  $("#form-error").textContent = "";
  $("#dialog-title").textContent = product ? "Edit product" : "Add product";
  $("#p-name").value = product?.name ?? "";
  $("#p-category").value = product?.category ?? "women";
  $("#p-size").value = product?.size ?? "100ml";
  $("#p-price").value = product?.price ?? "";
  $("#p-stock").value = product?.stock ?? 10;
  $("#p-description").value = product?.description ?? "";
  setPreview(product ? productImage(product, "../") : "");
  $("#product-dialog").showModal();
}

function setPreview(src) {
  const img = $("#p-preview");
  img.hidden = !src;
  if (src) img.src = src;
}
$("#p-image").addEventListener("change", event => {
  const file = event.target.files[0];
  if (file) setPreview(URL.createObjectURL(file));
});

// Shrinks a photo and returns it as a JPEG data URL small enough to store with the product.
async function compressImage(file) {
  if (!file.type.startsWith("image/")) throw new Error("That file is not an image.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 900 / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  for (let quality = 0.85; quality >= 0.4; quality -= 0.1) {
    const url = canvas.toDataURL("image/jpeg", quality);
    if (url.length < 600000) return url;
  }
  throw new Error("This image is too detailed to store. Try a smaller photo.");
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  const save = $("#save-product");
  save.disabled = true;
  $("#form-error").textContent = "";
  try {
    let image = state.editing?.image || "";
    const file = $("#p-image").files[0];
    if (file) image = await compressImage(file);
    if (!image) throw new Error("Please choose a product image.");

    const id = state.editing ? state.editing.id : Math.max(0, ...state.products.map(p => p.id)) + 1;
    await setDoc(doc(db, "products", String(id)), {
      id,
      name: $("#p-name").value.trim(),
      category: $("#p-category").value,
      size: $("#p-size").value.trim(),
      price: Math.max(0, Math.round(Number($("#p-price").value))),
      stock: Math.max(0, Math.round(Number($("#p-stock").value))),
      description: $("#p-description").value.trim(),
      image
    });
    $("#product-dialog").close();
    toast(state.editing ? "Product updated." : "Product added.");
  } catch (error) {
    $("#form-error").textContent = error.message || "Couldn't save the product.";
  } finally {
    save.disabled = false;
  }
});

/* ---------- orders ---------- */
function orderDate(order) {
  const date = order.createdAt?.toDate?.();
  return date ? date.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : "Just now";
}

function renderOrders() {
  const filter = $("#order-filter").value;
  const orders = state.orders.filter(order => filter === "all" || order.status === filter);
  const fresh = state.orders.filter(order => order.status === "new").length;
  $("#new-count").hidden = !fresh;
  $("#new-count").textContent = fresh;
  $("#order-summary").textContent = `${state.orders.length} order${state.orders.length === 1 ? "" : "s"} in total`;

  $("#orders-list").innerHTML = orders.length ? orders.map(order => {
    const customer = order.customer || {};
    const status = STATUS_LABELS[order.status] ? order.status : "new";
    return `
      <details class="order" data-id="${esc(order.id)}"${state.openOrders.has(order.id) ? " open" : ""}>
        <summary>
          <span class="order-no">#${esc(order.id.slice(0, 6).toUpperCase())}</span>
          <span>${esc(customer.name)}</span>
          <span class="muted">${esc(orderDate(order))}</span>
          <strong>${money(order.total)}</strong>
          <span class="badge st-${status}">${STATUS_LABELS[status]}</span>
        </summary>
        <div class="order-body">
          <div>
            <h3>Contact</h3>
            <p>${esc(customer.name)}<br><a href="tel:${esc(customer.phone)}">${esc(customer.phone)}</a><br><a href="mailto:${esc(customer.email)}">${esc(customer.email)}</a></p>
          </div>
          <div>
            <h3>Delivery address</h3>
            <p>${esc(customer.address)}</p>
          </div>
          <table class="order-items">
            <tbody>${(order.items || []).map(item => `<tr><td>${esc(item.name)} <span class="muted">${esc(item.size)}</span> × ${esc(item.quantity)}</td><td>${money(item.price * item.quantity)}</td></tr>`).join("")}</tbody>
          </table>
          <div class="order-status">
            <label for="status-${esc(order.id)}">Status</label>
            <select id="status-${esc(order.id)}" data-status="${esc(order.id)}">
              ${Object.entries(STATUS_LABELS).map(([value, label]) => `<option value="${value}"${value === status ? " selected" : ""}>${label}</option>`).join("")}
            </select>
          </div>
        </div>
      </details>`;
  }).join("") : `<p class="muted">No orders to show.</p>`;
}

$("#order-filter").addEventListener("change", renderOrders);

// Remember which orders are open so live updates don't collapse them.
$("#orders-list").addEventListener("toggle", event => {
  const order = event.target.closest?.("details.order");
  if (!order) return;
  order.open ? state.openOrders.add(order.dataset.id) : state.openOrders.delete(order.dataset.id);
}, true);

$("#orders-list").addEventListener("change", async event => {
  const select = event.target.closest("[data-status]");
  if (!select) return;
  try {
    await updateDoc(doc(db, "orders", select.dataset.status), { status: select.value });
    toast("Order status updated.");
  } catch { toast("Couldn't update the order."); }
});
