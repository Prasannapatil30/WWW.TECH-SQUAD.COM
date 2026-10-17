/* ===== TechSquad store – script.js =====
   Security notes for this file:
   - No eval, no inline handlers, no innerHTML with product/user text (only textContent + createElement).
   - SVG icons are static, trusted strings parsed with DOMParser.
   - Cart data from localStorage is re-validated against the catalog; stored prices are never trusted.
   - All user input is validated and cleaned before it is placed in the WhatsApp message.
*/
(() => {
  'use strict';

  // Frame-busting (real protection is the frame-ancestors / X-Frame-Options header, see _headers)
  if (window.top !== window.self) {
    try { window.top.location = window.self.location; } catch (e) { document.documentElement.textContent = ''; }
    return;
  }

  /* ---------- CONFIG (edit these) ---------- */
  const WHATSAPP_NUMBER = '91XXXXXXXXXX';   // country code + number, digits only, e.g. 919876543210
  const MAX_QTY = 10;
  const CART_KEY = 'techsquad_cart_v1';
  const MIN_SUBMIT_GAP_MS = 5000;

  /* ---------- CATALOG (edit prices and text here) ---------- */
  const PRODUCTS = [
    {
      id: 'ts-obstacle-car', cat: 'cars', icon: 'car', tag: 'Best seller', price: 1899,
      name: 'TechSquad Obstacle Avoidance Car Kit',
      short: 'A self-driving car that senses obstacles with an ultrasonic sensor and steers around them.',
      includes: ['Smart car chassis', 'Arduino-compatible controller board', 'L298N motor driver', 'HC-SR04 ultrasonic sensor', 'Jumper wires and USB cable', 'Ready-to-upload code and guide']
    },
    {
      id: 'ts-bluetooth-car', cat: 'cars', icon: 'bluetooth', tag: 'Beginner', price: 1499,
      name: 'TechSquad Bluetooth Control Car Kit',
      short: 'Drive your car from your phone over Bluetooth. Forward, back, left, right and speed control.',
      includes: ['Smart car chassis', 'Arduino-compatible controller board', 'L298N motor driver', 'HC-05 Bluetooth module', 'Jumper wires and USB cable', 'Ready-to-upload code and guide']
    },
    {
      id: 'ts-line-car', cat: 'cars', icon: 'line', tag: 'Popular', price: 1699,
      name: 'TechSquad Line Following Car Kit',
      short: 'A car that follows a black line using infrared sensors. A favourite for robotics competitions.',
      includes: ['Smart car chassis', 'Arduino-compatible controller board', 'L298N motor driver', 'TCRT5000 line tracking sensors', 'Jumper wires and USB cable', 'Ready-to-upload code and guide']
    },
    {
      id: 'ts-pro-arm', cat: 'pro', icon: 'arm', tag: 'Pro range', price: 2799,
      name: 'TechSquad Pro Robotic Arm with Web Control Kit',
      short: 'A robotic arm you control from a web page on your phone or laptop. A showpiece project.',
      includes: ['Robotic arm hardware', 'Servos and controller board', 'Web-control code', 'Assembly and setup guide']
    },
    {
      id: 'ts-pro-irrigation', cat: 'pro', icon: 'drop', tag: 'Pro range', price: 1999,
      name: 'TechSquad Pro Smart Irrigation Kit (ThingSpeak)',
      short: 'Monitor soil moisture and watering online with ThingSpeak. A great IoT and agriculture project.',
      includes: ['Sensors and controller for the project', 'ThingSpeak dashboard setup guide', 'Ready-to-upload code']
    },
    {
      id: 'ts-pro-home', cat: 'pro', icon: 'home', tag: 'Pro range', price: 1999,
      name: 'TechSquad Pro IoT Home Automation Kit (ESP8266)',
      short: 'Control home devices from a web page and WhatsApp using an ESP8266 Wi-Fi board.',
      includes: ['ESP8266 Wi-Fi controller', 'Relay and parts for the project', 'Web and WhatsApp control code', 'Setup guide'],
      warning: 'Safety: wiring mains-voltage appliances must be done by a qualified adult. Start by testing with low-voltage devices.'
    }
  ];
  const byId = new Map(PRODUCTS.map(p => [p.id, p]));

  /* ---------- Static, trusted SVG icons ---------- */
  const NS = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"';
  const ICONS = {
    car: `<svg ${NS}><rect x="14" y="52" width="92" height="30" rx="9"/><path d="M30 52l10-18h40l10 18"/><circle cx="36" cy="88" r="10"/><circle cx="84" cy="88" r="10"/><path d="M100 64h8M12 64h8"/></svg>`,
    bluetooth: `<svg ${NS}><path d="M38 42l44 36-22 20V22l22 20-44 36"/><path d="M96 34c6 7 6 45 0 52M24 34c-6 7-6 45 0 52"/></svg>`,
    line: `<svg ${NS}><path d="M14 98c34 0 30-56 50-56s20 38 42 38" stroke-dasharray="2 11"/><circle cx="64" cy="42" r="9"/><path d="M20 26h20M80 26h20"/></svg>`,
    arm: `<svg ${NS}><path d="M24 102h50"/><path d="M49 102V76"/><circle cx="49" cy="70" r="7"/><path d="M52 64l24-26"/><circle cx="80" cy="34" r="7"/><path d="M86 38l14 12M86 38l16-4"/></svg>`,
    drop: `<svg ${NS}><path d="M60 14C48 32 34 46 34 64a26 26 0 0 0 52 0c0-18-14-32-26-50z"/><path d="M60 100V80M60 90c-9 0-14-6-14-14M60 86c8 0 13-5 13-12"/></svg>`,
    home: `<svg ${NS}><path d="M18 62L60 24l42 38"/><path d="M28 54v46h64V54"/><path d="M46 76c8-8 20-8 28 0M52 84c5-5 11-5 16 0"/><circle cx="60" cy="92" r="1.5"/></svg>`
  };
  function svgFrom(str) {
    const doc = new DOMParser().parseFromString(str, 'image/svg+xml');
    return document.importNode(doc.documentElement, true);
  }

  /* ---------- Helpers ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  const rupee = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
  const money = n => rupee.format(n);
  function cleanText(s, max) {
    return String(s).replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
  }

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  /* ---------- Cart (validated against the catalog) ---------- */
  function loadCart() {
    const out = {};
    try {
      const raw = JSON.parse(localStorage.getItem(CART_KEY) || '{}');
      if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
        for (const [id, q] of Object.entries(raw)) {
          if (byId.has(id) && Number.isInteger(q) && q >= 1 && q <= MAX_QTY) out[id] = q;
        }
      }
    } catch (e) { /* ignore corrupted storage */ }
    return out;
  }
  let cart = loadCart();
  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* storage may be blocked */ }
  }
  const cartEntries = () => Object.entries(cart).map(([id, qty]) => ({ p: byId.get(id), qty }));
  const cartCount = () => Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotal = () => cartEntries().reduce((s, { p, qty }) => s + p.price * qty, 0);

  function addToCart(id) {
    if (!byId.has(id)) return;
    const next = (cart[id] || 0) + 1;
    if (next > MAX_QTY) { toast('Maximum ' + MAX_QTY + ' per kit. Contact us for bulk orders.'); return; }
    cart[id] = next;
    saveCart(); renderCart();
    toast('Added to cart');
  }
  function setQty(id, qty) {
    if (!byId.has(id)) return;
    if (qty < 1) delete cart[id];
    else if (qty <= MAX_QTY) cart[id] = qty;
    saveCart(); renderCart();
  }

  /* ---------- Product grid ---------- */
  const state = { filter: 'all', query: '', sort: 'featured' };

  function visibleProducts() {
    const q = state.query.toLowerCase();
    let list = PRODUCTS.filter(p =>
      (state.filter === 'all' || p.cat === state.filter) &&
      (!q || (p.name + ' ' + p.short).toLowerCase().includes(q)));
    if (state.sort === 'low') list = list.slice().sort((a, b) => a.price - b.price);
    if (state.sort === 'high') list = list.slice().sort((a, b) => b.price - a.price);
    return list;
  }

  function productCard(p) {
    const card = el('article', 'card');
    const art = el('div', 'card-art' + (p.cat === 'pro' ? ' pro' : ''));
    art.appendChild(svgFrom(ICONS[p.icon]));
    art.appendChild(el('span', 'tag' + (p.cat === 'pro' ? ' pro' : ''), p.tag));
    const body = el('div', 'card-body');
    body.appendChild(el('h3', '', p.name));
    body.appendChild(el('p', '', p.short));
    body.appendChild(el('div', 'price', money(p.price)));
    const actions = el('div', 'card-actions');
    const details = el('button', 'btn btn-ghost', 'Details');
    details.type = 'button';
    details.dataset.action = 'details';
    details.dataset.id = p.id;
    const add = el('button', 'btn btn-accent', 'Add to cart');
    add.type = 'button';
    add.dataset.action = 'add';
    add.dataset.id = p.id;
    actions.append(details, add);
    body.appendChild(actions);
    card.append(art, body);
    return card;
  }

  function renderGrid() {
    const grid = $('#productGrid');
    const list = visibleProducts();
    grid.replaceChildren();
    if (!list.length) {
      grid.appendChild(el('div', 'empty', 'No kits match your search. Try a different word.'));
    } else {
      list.forEach(p => grid.appendChild(productCard(p)));
    }
    $('#resultNote').textContent = list.length + (list.length === 1 ? ' kit' : ' kits') + ' shown';
  }

  /* ---------- Cart drawer ---------- */
  function renderCart() {
    $('#cartCount').textContent = String(cartCount());
    const box = $('#cartItems');
    box.replaceChildren();
    const entries = cartEntries();
    if (!entries.length) box.appendChild(el('p', 'cart-empty', 'Your cart is empty.'));
    entries.forEach(({ p, qty }) => {
      const row = el('div', 'line');
      const art = el('div', 'line-art' + (p.cat === 'pro' ? ' pro' : ''));
      art.appendChild(svgFrom(ICONS[p.icon]));

      const info = el('div', 'line-info');
      info.appendChild(el('b', '', p.name));
      info.appendChild(el('small', '', money(p.price) + ' each'));
      const qtyBox = el('div', 'qty');
      const minus = el('button', '', '−'); minus.type = 'button'; minus.setAttribute('aria-label', 'Decrease quantity');
      minus.dataset.action = 'dec'; minus.dataset.id = p.id;
      const num = el('span', '', String(qty));
      const plus = el('button', '', '+'); plus.type = 'button'; plus.setAttribute('aria-label', 'Increase quantity');
      plus.dataset.action = 'inc'; plus.dataset.id = p.id;
      qtyBox.append(minus, num, plus);
      info.appendChild(qtyBox);

      const end = el('div', 'line-end');
      end.appendChild(el('strong', '', money(p.price * qty)));
      const rm = el('button', 'link-btn', 'Remove'); rm.type = 'button';
      rm.dataset.action = 'remove'; rm.dataset.id = p.id;
      end.appendChild(rm);

      row.append(art, info, end);
      box.appendChild(row);
    });
    $('#cartTotal').textContent = money(cartTotal());
    $('#checkoutBtn').disabled = !entries.length;
  }

  const drawer = $('#drawer');
  const overlay = $('#overlay');
  function openCart() {
    drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false');
    overlay.hidden = false; $('#closeCart').focus();
  }
  function closeCart() {
    drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true');
    overlay.hidden = true; $('#cartBtn').focus();
  }

  /* ---------- Product details dialog ---------- */
  function openDetails(id) {
    const p = byId.get(id);
    if (!p) return;
    const body = $('#productBody');
    body.replaceChildren();
    const wrap = el('div', 'detail');
    const art = el('div', 'detail-art' + (p.cat === 'pro' ? ' pro' : ''));
    art.appendChild(svgFrom(ICONS[p.icon]));
    wrap.appendChild(art);
    wrap.appendChild(el('h2', '', p.name));
    wrap.appendChild(el('p', 'muted', p.short));
    wrap.appendChild(el('h4', '', 'What you get'));
    const ul = el('ul');
    p.includes.forEach(i => ul.appendChild(el('li', '', i)));
    wrap.appendChild(ul);
    if (p.warning) wrap.appendChild(el('p', 'note', p.warning));
    const foot = el('div', 'detail-foot');
    foot.appendChild(el('span', 'price', money(p.price)));
    const add = el('button', 'btn btn-accent btn-lg', 'Add to cart');
    add.type = 'button'; add.dataset.action = 'add'; add.dataset.id = p.id; add.dataset.closeDialog = 'productDialog';
    foot.appendChild(add);
    wrap.appendChild(foot);
    body.appendChild(wrap);
    $('#productDialog').showModal();
  }

  /* ---------- Checkout ---------- */
  const form = $('#checkoutForm');
  let lastSubmit = 0;

  function setErr(name, msg) {
    const small = $('[data-err="' + name + '"]', form);
    small.textContent = msg || '';
    small.closest('.field').classList.toggle('invalid', Boolean(msg));
    return !msg;
  }
  function validate(values) {
    let ok = true;
    ok = setErr('name', /^\p{L}[\p{L} .'-]{1,59}$/u.test(values.name) ? '' : 'Enter your full name (letters only).') && ok;
    ok = setErr('phone', /^[6-9]\d{9}$/.test(values.phone) ? '' : 'Enter a valid 10-digit Indian mobile number.') && ok;
    ok = setErr('address', values.address.length >= 10 ? '' : 'Enter your full address (at least 10 characters).') && ok;
    ok = setErr('pin', /^\d{6}$/.test(values.pin) ? '' : 'Enter a valid 6-digit PIN code.') && ok;
    return ok;
  }

  function openCheckout() {
    if (!cartCount()) { toast('Your cart is empty'); return; }
    $('#checkoutTotal').textContent = money(cartTotal());
    closeCart();
    $('#checkoutDialog').showModal();
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    if (String(data.get('website') || '') !== '') return;            // honeypot: bots fill this
    const now = Date.now();
    if (now - lastSubmit < MIN_SUBMIT_GAP_MS) { toast('Please wait a few seconds and try again.'); return; }

    const values = {
      name: cleanText(data.get('name') || '', 60),
      phone: String(data.get('phone') || '').replace(/\D/g, '').slice(0, 10),
      address: cleanText(data.get('address') || '', 200),
      pin: String(data.get('pin') || '').replace(/\D/g, '').slice(0, 6)
    };
    if (!validate(values)) return;
    if (!cartCount()) { toast('Your cart is empty'); return; }

    if (!/^\d{10,15}$/.test(WHATSAPP_NUMBER)) {
      toast('Store owner: set WHATSAPP_NUMBER in script.js first.');
      return;
    }
    lastSubmit = now;

    // Prices are recalculated here from the catalog, never from stored or typed values.
    const lines = cartEntries().map(({ p, qty }) => '- ' + p.name + ' x ' + qty + ' = ' + money(p.price * qty));
    const message = [
      'New TechSquad order',
      '',
      ...lines,
      '',
      'Total: ' + money(cartTotal()),
      '',
      'Name: ' + values.name,
      'Phone: ' + values.phone,
      'Address: ' + values.address + ' - ' + values.pin
    ].join('\n');

    const url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message);
    window.open(url, '_blank', 'noopener,noreferrer');
    toast('Opening WhatsApp to confirm your order');
    cart = {}; saveCart(); renderCart();
    form.reset();
    $('#checkoutDialog').close();
  });

  /* ---------- Events (one delegated listener, no inline handlers) ---------- */
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-action], [data-filter], [data-close]');
    if (!t) return;

    if (t.dataset.filter) {
      state.filter = ['all', 'cars', 'pro'].includes(t.dataset.filter) ? t.dataset.filter : 'all';
      $$('.cat').forEach(b => b.classList.toggle('is-active', b === t));
      renderGrid();
      return;
    }
    if (t.dataset.close) {
      const d = document.getElementById(t.dataset.close);
      if (d && d.tagName === 'DIALOG') d.close();
      return;
    }
    const id = t.dataset.id;
    switch (t.dataset.action) {
      case 'add':
        addToCart(id);
        if (t.dataset.closeDialog) $('#' + t.dataset.closeDialog).close();
        break;
      case 'details': openDetails(id); break;
      case 'inc': setQty(id, (cart[id] || 0) + 1); break;
      case 'dec': setQty(id, (cart[id] || 0) - 1); break;
      case 'remove': setQty(id, 0); break;
    }
  });

  $('#cartBtn').addEventListener('click', openCart);
  $('#closeCart').addEventListener('click', closeCart);
  overlay.addEventListener('click', closeCart);
  $('#checkoutBtn').addEventListener('click', openCheckout);
  $('#clearCart').addEventListener('click', () => { cart = {}; saveCart(); renderCart(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.classList.contains('open')) closeCart(); });

  // Close a dialog when the dark backdrop is clicked
  $$('dialog').forEach(d => d.addEventListener('click', (e) => { if (e.target === d) d.close(); }));

  $('#searchForm').addEventListener('submit', (e) => {
    e.preventDefault();
    state.query = cleanText($('#searchInput').value, 60);
    renderGrid();
    document.getElementById('shop').scrollIntoView({ behavior: 'smooth' });
  });
  $('#searchInput').addEventListener('input', (e) => {
    state.query = cleanText(e.target.value, 60);
    renderGrid();
  });
  $('#sortSelect').addEventListener('change', (e) => {
    state.sort = ['featured', 'low', 'high'].includes(e.target.value) ? e.target.value : 'featured';
    renderGrid();
  });

  $('#year').textContent = String(new Date().getFullYear());
  renderGrid();
  renderCart();
})();
