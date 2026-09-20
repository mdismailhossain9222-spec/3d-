const { chromium } = require("playwright");
const BASE = "http://localhost:3000";
(async () => {
  const browser = await chromium.launch({ headless: true });
  const out = [];
  for (const vp of [{ width: 375, height: 667 }, { width: 320, height: 568 }]) {
    const ctx = await browser.newContext({ viewport: vp });
    const p = await ctx.newPage();
    const errs = [];
    p.on("pageerror", (e) => errs.push(e.message.slice(0, 80)));
    for (const route of ["/", "/shop", "/product/faistof-one", "/cart", "/deals", "/compare"]) {
      await p.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 45000 });
      await p.waitForTimeout(1600);
      const sw = await p.evaluate(() => document.documentElement.scrollWidth);
      out.push(`${vp.width}px ${route.padEnd(22)} overflow=${sw > vp.width + 2 ? "YES (" + sw + ")" : "no"} errs=${errs.length}`);
    }
    if (vp.width === 375) { await p.goto(BASE + "/product/faistof-one"); await p.waitForTimeout(1500); await p.screenshot({ path: "/home/user/faistof/qa/20-mobile-pdp.png" }); await p.goto(BASE + "/"); await p.waitForTimeout(1500); await p.screenshot({ path: "/home/user/faistof/qa/21-mobile-home.png" }); }
    await ctx.close();
  }
  // reduced motion
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const p = await ctx.newPage();
  const rmErrs = [];
  p.on("pageerror", (e) => rmErrs.push(e.message.slice(0, 80)));
  await p.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 45000 });
  await p.waitForTimeout(2500);
  const heroVisible = await p.locator("h1").first().isVisible().catch(() => false);
  out.push(`reduced-motion home: hero=${heroVisible ? "visible" : "MISSING"} errs=${rmErrs.length}`);
  await p.screenshot({ path: "/home/user/faistof/qa/22-reduced-motion.png" });
  await ctx.close();
  await browser.close();
  console.log(out.join("\n"));
})().catch((e) => { console.error("FATAL", e.message); process.exit(1); });
