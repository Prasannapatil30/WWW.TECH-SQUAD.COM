# TechSquad Store (static website)

Files: `index.html`, `style.css`, `script.js`, `logo.svg`, `_headers`.
No frameworks, no third-party scripts, no external fonts, nothing to install.

## Run it
Double-click `index.html`. To publish, upload the folder to Cloudflare Pages or Netlify (both are free, give HTTPS automatically, and read `_headers`).

## Before you go live (edit these)
1. `script.js` -> `WHATSAPP_NUMBER` is already set to `919689697979`. All orders go to this WhatsApp number. Change it there (and in the footer of `index.html`) if you ever switch numbers.
   Payment choices (COD, UPI, Card/Net Banking) are in `PAYMENTS` in `script.js` and in the checkout form in `index.html`. The chosen method is included in the WhatsApp message. UPI and card payments are not taken on the website: you send the payment QR or link on WhatsApp after confirming the order.
2. `script.js` -> `PRODUCTS`: prices, descriptions and "What you get" lists. **Make them match the parts you actually ship.** I assumed Arduino-compatible boards for the three cars (as in your Robu cart) and left battery details out; add "Batteries not included" if that is true.
3. `index.html` footer: add your real email and WhatsApp number.
4. Replace the drawn icons with real photos later: add images to the folder and show them in `productCard()`.
5. Add Privacy Policy, Terms and Return/Refund pages. Indian customers and payment providers expect them.

## About the three "Pro range" kits
They are named "TechSquad ..." as you asked. Check that your supplier allows you to resell them under your own brand, and that the contents and instructions match your descriptions.

## Security: what is built in, and what it cannot do
No website can be promised "unhackable". What matters is a small attack surface and correct settings. This site is static (no server, no database, no login), so there is very little to attack.

Built into the code:
- Strict Content-Security-Policy: only your own `script.js` and `style.css` run; injected scripts are blocked.
- No `innerHTML` with product or user text, so no script injection (XSS).
- All form input validated and cleaned; honeypot field and a submit delay to slow bots.
- Cart data is re-checked against the catalog, so editing localStorage cannot change a price.
- No card details, passwords or secrets handled or stored anywhere.
- Links that open new tabs use `noopener noreferrer`; frame-busting against clickjacking.

You must also do (this is where real security comes from):
- Host on HTTPS only (Cloudflare Pages / Netlify do this automatically) and keep the `_headers` file in the uploaded folder.
- Turn on 2-factor authentication for your hosting, domain, email and GitHub accounts. Stolen accounts are how most small sites really get "hacked".
- Never put passwords, API keys or secret tokens in these files.
- Put the domain behind Cloudflare (free plan) for DDoS and bot protection.
- When you add online payments, use a hosted checkout (Razorpay, Cashfree, PayU or similar). Never collect card numbers on your own page.
- If you later add a backend, accounts or a database: hash passwords with bcrypt/argon2, use parameterised queries, rate-limit logins, validate everything again on the server (browser checks can be bypassed), and keep dependencies updated.

## How checkout works now
There is no payment system. The customer fills the form and the order opens in WhatsApp for you to confirm, then you collect payment yourself (for example UPI). That keeps card data away from your site completely.
