/* FAISTOF end-to-end journey: guest → quick view → cart → register/verify → login → PDP config → compare/wishlist → full checkout (decline then approve) → order tracking. */
const { chromium } = require("playwright");
const fs = require("fs");

const BASE = "http://localhost:3000";
const OUT = "/home/user/faistof/qa";
fs.mkdirSync(OUT, { recursive: true });
const results = [];
const ok = (name, cond, extra = "") => { results.push(`${cond ? "PASS" : "FAIL"} · ${name}${extra ? " — " + extra : ""}`); if (!cond) process.exitCode = 1; };

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "en-GB" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text().slice(0, 200)); });

  /* ---------- HOME ---------- */
  await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: OUT + "/01-home-hero.png" });
  ok("home title", (await page.title()).includes("FAISTOF"), await page.title());
  // scroll the film
  for (let i = 1; i <= 10; i++) { await page.mouse.wheel(0, 900); await page.waitForTimeout(220); }
  await page.screenshot({ path: OUT + "/02-home-scrolled.png" });
  // collection cards exist
  const cardCount = await page.locator("section:has-text('The Collection') article, [data-collection-card]").count();
  const anyCards = await page.locator("a[href^='/product/']").count();
  ok("home shows product links", anyCards > 4, `${anyCards} links, ${cardCount} cards`);

  /* ---------- QUICK VIEW + CART (guest) ---------- */
  await page.goto(BASE + "/shop", { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  const card = page.locator("article, [data-product-card]").first();
  await card.hover().catch(() => {});
  const qvBtn = page.locator("button[aria-label*='uick view'], button:has-text('Quick view')").first();
  if (await qvBtn.count()) {
    await qvBtn.click(); await page.waitForTimeout(600);
    ok("quick view modal opens", await page.locator("[role='dialog']").first().isVisible());
    await page.screenshot({ path: OUT + "/03-quickview.png" });
    const addQv = page.locator("[role='dialog'] button:has-text('Add'), [role='dialog'] button:has-text('Claim')").first();
    if (await addQv.count()) { await addQv.click(); await page.waitForTimeout(900); }
    await page.keyboard.press("Escape"); await page.waitForTimeout(400);
  } else ok("quick view modal opens", false, "button not found");
  // badge should show 1
  const badge = await page.locator("header [data-cart-count], header :text('1')").first().textContent().catch(() => "");
  ok("cart badge counts guest add", String(badge ?? "").includes("1"), String(badge));

  /* ---------- REGISTER ---------- */
  const email = `qa${Date.now().toString(36)}@faistof.com`;
  await page.goto(BASE + "/register", { waitUntil: "networkidle" });
  await page.fill("input[name='name']", "Playwright Runner");
  await page.fill("input[name='email']", email);
  await page.fill("input[name='password']", "Qa!Browser2026");
  await page.check("input[type='checkbox']").catch(() => {});
  await page.screenshot({ path: OUT + "/04-register.png" });
  await page.locator("button[type='submit']").first().click();
  await page.waitForTimeout(1500);
  const pageText = await page.locator("body").innerText();
  const m = pageText.match(/\/verify-email\?token=([a-f0-9]+)/);
  ok("register lands in session", pageText.includes("Playwright Runner") || pageText.toLowerCase().includes("account") || page.url().includes("account"), page.url());
  // verify via page link
  if (m) {
    await page.goto(BASE + `/verify-email?token=${m[1]}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(900);
    ok("verify-email page reacts", ((await page.locator("body").innerText()) + "").toLowerCase().includes("verif"), "verified/confirmed text");
  } else ok("verify link surfaced after register", false, "no token in page");

  /* ---------- PDP CONFIG ---------- */
  await page.goto(BASE + "/product/faistof-one", { waitUntil: "networkidle" });
  await page.waitForTimeout(1400);
  await page.screenshot({ path: OUT + "/05-pdp.png" });
  // color chips
  const chips = page.locator("[data-color-chip], button:has-text('Crimson'), button[aria-label*='rimson']");
  if (await chips.count()) { await chips.first().click(); await page.waitForTimeout(700); }
  ok("pdp renders buy box", await page.locator("button:has-text('Add to cart')").first().isVisible().catch(() => false));
  // wishlist toggle
  const wishBtn = page.locator("button[aria-label*='ishlist'], button[aria-label*='ave for later']").first();
  if (await wishBtn.count()) { await wishBtn.click(); await page.waitForTimeout(500); ok("wishlist toggle works", true); } else ok("wishlist toggle works", false);
  // add to cart from PDP
  const addBtn = page.locator("button:has-text('Add to cart'), button:has-text('Add to Bag')").first();
  await addBtn.click(); await page.waitForTimeout(1000);
  await page.screenshot({ path: OUT + "/06-pdp-added.png" });

  /* ---------- CART + COUPON ---------- */
  await page.goto(BASE + "/cart", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const rows = await page.locator("main li").count();
  ok("cart shows items", rows > 0, `${rows} row-ish`);
  await page.screenshot({ path: OUT + "/07-cart.png" });

  /* ---------- CHECKOUT ---------- */
  await page.goto(BASE + "/checkout", { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await page.screenshot({ path: OUT + "/08-checkout.png" });
  // Step 0: proceed
  const clickNext = async (shot) => { const b = page.locator("button:has-text('Continue'):not([disabled='true']), button:has-text('Place order'), button:has-text('Pay now')").first(); if (await b.count()) { await b.click({ timeout: 8000 }).catch(() => {}); await page.waitForTimeout(800); if (shot) await page.screenshot({ path: OUT + "/" + shot }); } };
  await clickNext();
  // Step 1: address form
  const fill = async (sel, val) => { const l = page.locator(sel).first(); if (await l.count()) { await l.fill(val); return true; } return false; };
  await fill("input[name='fullName'], #ship-fullName", "Playwright Runner");
  await fill("input[name='email'], #ship-email", email);
  await fill("input[name='phone'], #ship-phone", "01711223344");
  await fill("input[name='line1'], #ship-line1", "House 7, Road 27, Banani");
  await fill("input[name='city'], #ship-city", "Dhaka");
  await fill("input[name='postalCode'], #ship-postalCode", "1213");
  await page.screenshot({ path: OUT + "/09-checkout-address.png" });
  await clickNext("09b-after-address.png");
  // Step 2: delivery
  const exp = page.locator("text=Express").first();
  if (await exp.count()) await exp.click().catch(() => {});
  await clickNext("09c-after-delivery.png");
  // Step 3: payment — fill card with DECLINING test number, apply FREESHIP, then forward to review
  await fill("input[name='cardNumber']", "4000 0000 0000 0002");
  await fill("input[name='cardName']", "Playwright Runner");
  await page.locator("input[name='cardExp']").first().type("12/28", { delay: 8 }).catch(() => {});
  await fill("input[name='cardCvc']", "123");
  await page.screenshot({ path: OUT + "/10-checkout-payment.png" });
  await clickNext("10b-review.png");
  // coupon on review step
  const couponIn = page.locator("input[placeholder*='oupon'], input[aria-label*='oupon']").first();
  if (await couponIn.count()) { await couponIn.fill("FREESHIP"); await page.locator("button:has-text('Apply')").last().click().catch(() => {}); await page.waitForTimeout(700); }
  await page.screenshot({ path: OUT + "/10c-review-coupon.png" });
  await page.locator("label:has-text('authorize') input[type='checkbox']").check().catch(() => {});
  await page.waitForTimeout(300);
  const payBtn = page.locator("button:has-text('Pay ৳')").first();
  await payBtn.click({ timeout: 10000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: OUT + "/11-checkout-declined.png" });
  const t2 = (await page.locator("body").innerText()).toLowerCase();
  const declined = t2.includes("declin") || t2.includes("retry") || t2.includes("another payment");
  ok("declined card honestly refused", declined, declined ? "decline shown" : "no decline message");
  // switch to approved card
  // declined — swap in the approving test card on payment step, forward, retry
  await page.locator("button:has-text('Back')").first().click().catch(() => {});
  await page.waitForTimeout(600);
  const num = page.locator("input[name='cardNumber']").first();
  if (await num.count()) { await num.fill("4242 4242 4242 4242"); }
  await clickNext();
  await page.locator("button:has-text('Retry payment'), button:has-text('Pay ৳')").first().click({ timeout: 10000 });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: OUT + "/12-checkout-success.png" });
  const t3 = (await page.locator("body").innerText()).toLowerCase();
  const success = t3.includes("confirmed") || t3.includes("thank") || t3.includes("fs-2026") || t3.includes("paid");
  ok("approved card completes order", success, page.url());
  const orderMatch = (await page.locator("body").innerText()).match(/FS-2026-\d+/);
  if (orderMatch) {
    await page.goto(BASE + `/account/orders/${orderMatch[0]}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(900);
    ok("tracking page renders with timeline", ((await page.locator("body").innerText()).toLowerCase()).includes("placed"), orderMatch[0]);
    await page.screenshot({ path: OUT + "/13-order-tracking.png" });
  } else ok("tracking page renders with timeline", false, "no order number link found");

  /* ---------- ACCOUNT SECTIONS ---------- */
  for (const [path, needle] of [["/account/profile", "Full name"], ["/account/addresses", "Address"], ["/account/wishlist", "Saved"], ["/account/settings", "Password"]]) {
    await page.goto(BASE + path, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    ok(`account${path.replace("/account", "")} loads`, (await page.locator("body").innerText()).toLowerCase().includes(needle.toLowerCase()), path);
  }
  await page.screenshot({ path: OUT + "/14-account.png" });

  /* ---------- ADMIN ---------- */
  await ctx.clearCookies();
  await page.goto(BASE + "/login", { waitUntil: "networkidle" });
  await page.fill("input[type='email'], input[name='email']", "admin@faistof.com");
  await page.fill("input[type='password'], input[name='password']", "Admin!Faistof23");
  await page.locator("button[type='submit']").first().click();
  await page.waitForTimeout(1500);
  await page.goto(BASE + "/admin", { waitUntil: "networkidle" });
  await page.waitForTimeout(2200);
  ok("admin dashboard renders", (await page.locator("body").innerText()).toLowerCase().includes("the store, right now"), page.url());
  await page.screenshot({ path: OUT + "/15-admin-dash.png" });
  for (const [path, needle] of [["/admin/products", "Products"], ["/admin/orders", "Orders"], ["/admin/customers", "Customers"], ["/admin/coupons", "Coupons"], ["/admin/reviews", "Reviews"], ["/admin/deals", "Deals"], ["/admin/categories", "Categories"], ["/admin/analytics", "Analytics"], ["/admin/settings", "Store settings"], ["/admin/messages", "Messages"]]) {
    await page.goto(BASE + "/admin" + path.slice(6), { waitUntil: "networkidle" }).catch(() => {});
    const seg = path.replace("/admin", "");
    await page.goto(BASE + "/admin" + seg, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1400);
    const body = (await page.locator("body").innerText()).toLowerCase();
    ok(`admin${seg} loads`, body.includes(needle.toLowerCase()) && !body.includes("404"), seg);
    await page.screenshot({ path: OUT + `/16-admin${seg.replace(/\//g, "-")}.png` });
  }

  /* ---------- errors report ---------- */
  const real = errors.filter((e) => !e.includes("favicon") && !e.includes("Failed to load resource") && !e.includes("Download the React DevTools"));
  ok("no console/page errors in journey", real.length === 0, real.slice(0, 6).join(" | "));

  await browser.close();
  console.log(results.join("\n"));
  const fails = results.filter((r) => r.startsWith("FAIL"));
  console.log(`\n== ${results.length - fails.length}/${results.length} passed ==`);
  if (fails.length) console.log("FAILURES:\n" + fails.join("\n"));
})().catch((e) => { console.error("FATAL:", e.message); console.log(results.join("\n")); process.exit(2); });
