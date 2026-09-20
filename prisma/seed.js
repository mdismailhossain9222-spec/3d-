/* FAISTOF database seeder — CommonJS so it runs with plain `node`. */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const catalog = require("./catalog.json");

const prisma = new PrismaClient();
const now = Date.now();
const hours = (h) => new Date(now + h * 3600_000);
const days = (d) => new Date(now + d * 86_400_000);

async function main() {
  console.log("Seeding FAISTOF database…");

  // wipe (children first)
  for (const model of [
    "payment", "orderItem", "order", "couponRedemption", "coupon", "review",
    "wishlistItem", "wishlist", "cartItem", "cart", "address", "authToken",
    "inventory", "productVariant", "productImage", "product", "deal", "category",
    "newsletterSubscriber", "contactMessage", "pageView", "storeSetting", "user", "role",
  ]) {
    await prisma[model].deleteMany();
  }

  await prisma.role.createMany({ data: [
    { key: "CUSTOMER", name: "Customer" },
    { key: "ADMIN", name: "Administrator" },
  ]});

  // ── users ──
  const userIds = {};
  for (const c of catalog.customers) {
    const u = await prisma.user.create({ data: {
      email: c.email, name: c.name, roleKey: c.role, phone: c.phone ?? null,
      passwordHash: await bcrypt.hash(c.password, 12), emailVerified: true,
      disabled: false,
    }});
    userIds[c.email] = u.id;
  }
  const adminId = userIds["admin@faistof.com"];
  const demoId = userIds["demo@faistof.com"];

  await prisma.address.create({ data: {
    userId: demoId, fullName: "Rafi Demo", phone: "+8801711223344",
    line1: "House 42, Road 11, Banani", line2: "Apt 5B", city: "Dhaka",
    postalCode: "1213", country: "Bangladesh", label: "HOME", isDefault: true,
  }});
  await prisma.address.create({ data: {
    userId: demoId, fullName: "Rafi Demo", phone: "+8801711223344",
    line1: "Level 9, FAISTOF Tower, Gulshan-2", city: "Dhaka",
    postalCode: "1212", country: "Bangladesh", label: "WORK", isDefault: false,
  }});

  // ── categories ──
  const catIds = {};
  for (const c of catalog.categories) {
    const parent = await prisma.category.create({ data: {
      name: c.name, slug: c.slug, description: c.description, position: 0,
    }});
    catIds[c.slug] = parent.id;
    for (const [i, ch] of (c.children ?? []).entries()) {
      const child = await prisma.category.create({ data: {
        name: ch.name, slug: ch.slug, parentId: parent.id, position: i,
      }});
      catIds[ch.slug] = child.id;
    }
  }

  // ── deals ──
  const dealIds = {};
  for (const d of catalog.deals) {
    const deal = await prisma.deal.create({ data: {
      title: d.title, subtitle: d.subtitle, type: d.type, badge: d.badge, banner: d.banner,
      startsAt: hours(d.hoursFromSeed[0]), endsAt: hours(d.hoursFromSeed[1]),
    }});
    dealIds[d.key] = deal.id;
  }

  // ── products + variants + inventory + images ──
  const productIds = {};
  for (const p of catalog.products) {
    const deal = p.deal ? dealIds[p.deal] : null;
    const dealPrice = p.deal
      ? Math.round(p.basePrice * (p.deal === "flash" ? 0.86 : p.deal === "flagship" ? 0.92 : p.deal === "bundle" ? 0.9 : 0.85) / 1000) * 1000
      : null;
    const prod = await prisma.product.create({ data: {
      slug: p.slug, name: p.name, tagline: p.tagline, description: p.description,
      categoryId: catIds[p.categorySlug], basePrice: p.basePrice,
      compareAtPrice: p.compareAtPrice, featured: p.featured, isNew: p.isNew, badge: p.badge,
      ratingAverage: p.ratingAverage, ratingCount: p.ratingCount,
      colorsJson: JSON.stringify(p.colors), specsJson: JSON.stringify(p.specs),
      highlightsJson: JSON.stringify(p.highlights),
      dealId: deal, dealPrice,
    }});
    productIds[p.slug] = prod.id;

    for (const [i, img] of p.images.entries()) {
      await prisma.productImage.create({ data: {
        productId: prod.id, url: img.url, alt: img.alt,
        colorKey: img.colorKey ?? null, position: i, primary: !!img.primary,
      }});
    }

    let v = 0;
    for (const m of p.memory) {
      const sizeOpts = m.sizeOptions ?? [{ label: null, priceDelta: 0 }];
      for (const size of sizeOpts) {
        for (const [ci, colorKey] of m.colors.entries()) {
          const color = p.colors.find((c) => c.key === colorKey);
          const price = p.basePrice + (m.priceDelta ?? 0) + (color?.priceDelta ?? 0) + (size.priceDelta ?? 0);
          const prefix = p.slug.split("-").map((s) => s[0]).join("").toUpperCase();
          const sku = `FS-${prefix}-${m.ram ?? "0"}-${m.storage ?? String(size.label ?? "STD").replace(/\W+/g, "").toUpperCase().slice(0, 6)}-${colorKey.toUpperCase().slice(0, 3)}-${String(++v).padStart(2, "0")}`;
          const label = [m.ram ? `${m.ram}GB / ${m.storage}GB` : null, size.label, color?.label].filter(Boolean).join(" · ");
          const stock = (m.stock ?? [10])[sizeOpts.length > 1 ? 0 : ci] ?? 10;
          const dealRatio = dealPrice != null ? dealPrice / p.basePrice : 1;
          const variant = await prisma.productVariant.create({ data: {
            productId: prod.id, sku, label, colorKey, ramGb: m.ram, storageGb: m.storage,
            price: Math.round(price * dealRatio),
            compareAtPrice: dealRatio < 1 ? price : (p.compareAtPrice ? price + (p.compareAtPrice - p.basePrice) : null),
            configJson: JSON.stringify({ size: size.label, originalPrice: price }),
          }});
          await prisma.inventory.create({ data: {
            variantId: variant.id, quantity: stock, reserved: 0,
            warehouse: "DHK-01", restockAt: stock === 0 ? days(5) : null,
          }});
        }
      }
    }
  }

  // ── reviews (linked where possible; compute product aggregates honestly) ──
  const perProduct = {};
  for (const r of catalog.reviews) {
    const user = Object.keys(userIds).find((e) => e.startsWith(r.author.split(" ")[0].toLowerCase()));
    const rating = r.rating;
    const slug = r.product;
    perProduct[slug] ??= { sum: 0, n: 0 };
    perProduct[slug].sum += rating; perProduct[slug].n += 1;
    await prisma.review.create({ data: {
      productId: productIds[slug], userId: user ? userIds[user] : null,
      authorName: r.author, rating, title: r.title, body: r.body,
      verified: r.verified, approved: true, helpful: crypto.randomInt(0, 42),
      createdAt: days(-crypto.randomInt(1, 60)),
    }});
  }
  for (const [slug, agg] of Object.entries(perProduct)) {
    const p = catalog.products.find((x) => x.slug === slug);
    const catAvg = p.ratingAverage, catN = p.ratingCount;
    const totalN = catN + agg.n;
    const avg = (catAvg * catN + agg.sum) / totalN;
    await prisma.product.update({ where: { id: productIds[slug] }, data: {
      ratingAverage: Math.round(avg * 10) / 10, ratingCount: totalN,
    }});
  }

  // ── coupons ──
  for (const c of catalog.coupons) {
    await prisma.coupon.create({ data: {
      code: c.code, description: c.description, type: c.type ?? "PERCENT", value: c.value,
      minSubtotal: c.minSubtotal ?? null, maxUses: c.maxUses ?? null, perUser: c.perUser ?? null,
      usedCount: c.code === "WELCOME10" ? 137 : 0,
      endsAt: c.expired ? days(-3) : null, isActive: c.active ?? true,
    }});
  }

  // ── demo wishlist for the demo user ──
  const wish = await prisma.wishlist.create({ data: { userId: demoId } });
  for (const slug of ["faistof-one-pro", "faistof-buds", "faistof-power"]) {
    await prisma.wishlistItem.create({ data: { wishlistId: wish.id, productId: productIds[slug] } });
  }

  // ── orders (sample history for analytics/admin) ──
  const variants = await prisma.productVariant.findMany({ include: { product: true, inventory: true } });
  const statuses = ["DELIVERED","DELIVERED","DELIVERED","SHIPPED","PROCESSING","CONFIRMED","PLACED","DELIVERED","DELIVERED","SHIPPED","OUT_FOR_DELIVERY","DELIVERED"];
  const names = ["Arif Haque","Nusrat Jahan","Tanvir Rahman","Sadia Karim","Imran Ahmed","Farhana Quddus","Rafi Demo"];
  const emails = ["arif.haque@example.com","nusrat.jahan@example.com","tanvir.rahman@example.com","sadia.karim@example.com","imran.ahmed@example.com","farhana.quddus@example.com","demo@faistof.com"];
  for (let i = 0; i < 14; i++) {
    const nIdx = i % names.length;
    const placedAt = days(-Math.floor(90 - (i / 14) * 88));
    const chosen = [];
    const primary = variants.find(v => v.product.slug === ["faistof-one","faistof-one-pro","faistof-one-ultra","faistof-lite","faistof-buds","faistof-watch","faistof-power","faistof-case","faistof-charge"][i % 9] && v.inventory.quantity > 0);
    if (primary) chosen.push(primary);
    if (i % 3 === 0) { const extra = variants.find(v => v.product.slug === "faistof-case" && !chosen.includes(v)); if (extra) chosen.push(extra); }
    let subtotal = 0;
    const items = chosen.map(vw => {
      const qty = 1 + (i % 4 === 0 && vw.product.slug.startsWith("faistof-one") ? 1 : 0);
      const total = vw.price * qty;
      subtotal += total;
      return { name: vw.product.name, sku: vw.sku, label: vw.label, image: vw.product.images?.[0]?.url, unitPrice: vw.price, quantity: qty, total, variantId: vw.id, productId: vw.productId };
    });
    if (!items.length) continue;
    const tax = Math.round(subtotal * 0.05);
    const shipping = subtotal > 5000000 ? 0 : 29900;
    const discount = i % 5 === 0 ? Math.round(subtotal * 0.1) : 0;
    const total = subtotal - discount + shipping + tax;
    const st = statuses[i % statuses.length];
    const timeline = buildTimeline(st, placedAt);
    const order = await prisma.order.create({ data: {
      number: `FS-2026-${String(100 + i).padStart(6, "0")}`,
      userId: nIdx === names.length - 1 ? demoId : null,
      status: st, paymentStatus: st === "PLACED" && i % 4 === 6 ? "PENDING" : "PAID",
      subtotal, discount, shipping, tax, total,
      couponCode: discount ? "WELCOME10" : null,
      shipName: names[nIdx], shipEmail: emails[nIdx], shipPhone: "+88017" + String(10000000 + i * 731),
      shipLine1: "House " + (7 + i) + ", Road " + (2 + i) + ", Dhanmondi", shipCity: "Dhaka",
      shipPostal: "120" + (i % 9), shipCountry: "Bangladesh",
      deliveryMethod: i % 4 === 0 ? "EXPRESS" : "STANDARD",
      timelineJson: JSON.stringify(timeline),
      createdAt: placedAt,
      items: { create: items.map(it => ({ ...it, image: "/renders/hero-obsidian.jpg" })) },
      payments: { create: { provider: "sandbox", intentId: "pi_sbx_" + crypto.randomBytes(8).toString("hex"), method: "CARD", status: "SUCCEEDED", amount: total, last4: "4242" } },
    }});
    void order;
  }
  // ensure demo user has an active order to track
  const demoVariants = await prisma.productVariant.findMany({ where: { product: { slug: "faistof-one" } }, take: 1, include: { product: true } });
  if (demoVariants[0]) {
    const vw = demoVariants[0];
    const subtotal = vw.price, tax = Math.round(subtotal * 0.05), total = subtotal + tax;
    await prisma.order.create({ data: {
      number: "FS-2026-000099", userId: demoId, status: "SHIPPED", paymentStatus: "PAID",
      subtotal, discount: 0, shipping: 0, tax, total,
      shipName: "Rafi Demo", shipEmail: "demo@faistof.com", shipPhone: "+8801711223344",
      shipLine1: "House 42, Road 11, Banani, Apt 5B", shipCity: "Dhaka", shipPostal: "1213",
      deliveryMethod: "STANDARD",
      timelineJson: JSON.stringify(buildTimeline("SHIPPED", days(-2))),
      createdAt: days(-2),
      items: { create: [{ name: "FAISTOF ONE", sku: vw.sku, label: vw.label, image: "/renders/hero-obsidian.jpg", unitPrice: vw.price, quantity: 1, total: vw.price, variantId: vw.id, productId: vw.productId }] },
      payments: { create: { provider: "sandbox", intentId: "pi_sbx_" + crypto.randomBytes(8).toString("hex"), method: "CARD", status: "SUCCEEDED", amount: total, last4: "4242" } },
    }});
  }

  // ── store settings ──
  for (const [k, v] of Object.entries(catalog.settings)) {
    await prisma.storeSetting.create({ data: { key: k, value: String(v) } });
  }

  // ── page views (90 days of synthetic traffic for analytics) ──
  const paths = ["/", "/shop", "/product/faistof-one", "/product/faistof-one-pro", "/product/faistof-one-ultra", "/deals", "/accessories", "/compare"];
  const pvData = [];
  for (let d = 89; d >= 0; d--) {
    const day = new Date(now - d * 86_400_000).toISOString().slice(0, 10);
    const weight = 1 + (89 - d) / 90 + Math.abs(Math.sin(d / 5)) * 0.35; // trending up toward today
    for (const [pi, path] of paths.entries()) {
      const n = Math.round((6 - pi * 0.5) * weight) + crypto.randomInt(0, 3);
      for (let k = 0; k < Math.max(1, n); k++) pvData.push({ path, day });
    }
  }
  await prisma.pageView.createMany({ data: pvData });

  console.log("Seed complete.");
  console.log("  admin: admin@faistof.com / Admin!Faistof23");
  console.log("  demo:  demo@faistof.com / Faistof!Demo1");
}

function buildTimeline(status, placedAt) {
  const all = [
    ["PLACED", 0, "Order placed and received"],
    ["CONFIRMED", 3, "Payment captured · order confirmed"],
    ["PROCESSING", 10, "Picking and QC in DHK-01"],
    ["SHIPPED", 26, "Handed to courier partner"],
    ["OUT_FOR_DELIVERY", 50, "On vehicle for final delivery"],
    ["DELIVERED", 56, "Delivered and signed"],
  ];
  const idx = all.findIndex((s) => s[0] === status);
  const out = all.slice(0, idx + 1).map(([st, h, note]) => ({ status: st, at: new Date(placedAt.getTime() + h * 3600_000).toISOString(), note }));
  return out;
}

main().catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
