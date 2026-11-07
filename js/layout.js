/* LARRYSCENT — shared layout
   Injects the skip link, announcement bar, header and footer on every page,
   so they are edited in ONE place. Load this BEFORE main.js.
   Each page sets: <body data-page="home|shop|about|contact|cart|checkout|product" data-root="" or "../"> */
(function () {
  "use strict";

  var body = document.body;
  var root = body.getAttribute("data-root") || "";
  var page = body.getAttribute("data-page") || "";

  var nav = [
    { key: "home", label: "Home", href: root + "index.html" },
    { key: "shop", label: "Shop", href: root + "shop.html" },
    { key: "about", label: "About", href: root + "pages/about.html" },
    { key: "contact", label: "Contact", href: root + "contact.html" }
  ];

  function current(key) { return key === page ? ' aria-current="page"' : ""; }

  var links = nav.map(function (item) {
    return '<a href="' + item.href + '"' + current(item.key) + ">" + item.label + "</a>";
  }).join("");

  var header =
    '<a class="skip-link" href="#main">Skip to content</a>' +
    '<div class="announcement">A beautiful fragrance makes every moment memorable.</div>' +
    '<header class="site-header">' +
      '<a class="brand" href="' + root + 'index.html">LARRYSCENT<span>Luxury perfumes</span></a>' +
      '<button class="menu-toggle" type="button" aria-label="Toggle navigation" aria-expanded="false" aria-controls="site-nav">☰</button>' +
      '<nav class="site-nav" id="site-nav" aria-label="Main">' + links +
        '<a class="bag-link" href="' + root + 'pages/cart.html"' + current("cart") + '>Bag (<span id="cart-count">0</span>)</a>' +
      "</nav>" +
    "</header>";

  var footer =
    '<footer class="site-footer">' +
      "<div>" +
        '<a class="brand footer-brand" href="' + root + 'index.html">LARRYSCENT<span>Luxury perfumes</span></a>' +
        "<p>Find a fragrance that feels like you.</p>" +
      "</div>" +
      "<div><h3>Explore</h3>" +
        '<a href="' + root + 'shop.html">Shop</a>' +
        '<a href="' + root + 'pages/about.html">About us</a>' +
        '<a href="' + root + 'contact.html">Contact</a>' +
      "</div>" +
      "<div><h3>Customer care</h3>" +
        '<a href="' + root + 'pages/cart.html">Shopping bag</a>' +
        '<a href="' + root + 'contact.html">Get in touch</a>' +
      "</div>" +
      '<p class="copyright">© ' + new Date().getFullYear() + " LARRYSCENT Luxury Perfumes.</p>" +
    "</footer>";

  body.insertAdjacentHTML("afterbegin", header);
  body.insertAdjacentHTML("beforeend", footer);

  // One fallback for every image on the site (including ones products.js renders).
  // Runs once per image, so a failing placeholder can never loop.
  document.addEventListener("error", function (e) {
    var img = e.target;
    if (!img || img.tagName !== "IMG" || img.getAttribute("data-fallback-done")) return;
    img.setAttribute("data-fallback-done", "1");
    var label = encodeURIComponent(img.getAttribute("data-fallback") || "LARRYSCENT");
    img.src = "https://placehold.co/800x1000/f4e3e8/684454?text=" + label;
  }, true);
})();
