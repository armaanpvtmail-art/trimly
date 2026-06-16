/* eslint-disable no-console */
import { PrismaClient, ThemeStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Trimly database...");

  // 1) Website settings singleton -------------------------------------------
  await prisma.websiteSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      siteName: process.env.NEXT_PUBLIC_APP_NAME || "Trimly",
      tagline: "Premium links, beautifully short.",
      supportEmail: process.env.ADMIN_EMAIL || "support@trimly.app",
      seoTitle: "Trimly — Premium URL Shortener",
      seoDescription:
        "Beautiful themed short links with real-time analytics for ₹90/month.",
      cashfreeEnv: process.env.CASHFREE_ENV || "PRODUCTION",
      planPriceInr: Number(process.env.PLAN_PRICE_INR || 90),
      planName: process.env.PLAN_NAME || "Premium Monthly",
      planDurationDays: Number(process.env.PLAN_DURATION_DAYS || 30),
    },
  });
  console.log("✓ Website settings ready");

  // 2) Admin bootstrap --------------------------------------------------------
  const adminEmail = process.env.ADMIN_EMAIL || "admin@trimly.app";
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe!2026";
  const adminHash = await bcrypt.hash(adminPassword, 12);
  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: { role: "SUPER_ADMIN", status: "ACTIVE" },
    create: {
      name: process.env.ADMIN_NAME || "Trimly Admin",
      email: adminEmail,
      passwordHash: adminHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    },
  });
  console.log(`✓ Admin ready: ${adminEmail}`);

  // 3) System themes ----------------------------------------------------------
  const systemThemes = [
    {
      name: "Aurora",
      slug: "aurora",
      description: "A vibrant animated gradient with a glassy countdown card.",
      config: {
        palette: { from: "#6366f1", via: "#a855f7", to: "#ec4899" },
        mode: "dark",
        animation: "gradient",
        font: "Inter",
      },
      previewImage: "/themes/aurora/preview.svg",
      countdownDefault: 5,
    },
    {
      name: "Midnight",
      slug: "midnight",
      description: "A deep, minimal dark theme with a subtle starfield.",
      config: {
        palette: { from: "#0f172a", via: "#1e293b", to: "#0b1020" },
        mode: "dark",
        animation: "stars",
        font: "Inter",
      },
      previewImage: "/themes/midnight/preview.svg",
      countdownDefault: 5,
    },
    {
      name: "Sunrise",
      slug: "sunrise",
      description: "A warm light theme with a soft radial glow.",
      config: {
        palette: { from: "#fb923c", via: "#f59e0b", to: "#ef4444" },
        mode: "light",
        animation: "pulse",
        font: "Inter",
      },
      previewImage: "/themes/sunrise/preview.svg",
      countdownDefault: 5,
    },
    {
      name: "Minimal",
      slug: "minimal",
      description: "Clean, neutral, distraction-free redirect screen.",
      config: {
        palette: { from: "#ffffff", via: "#f8fafc", to: "#e2e8f0" },
        mode: "light",
        animation: "none",
        font: "Inter",
      },
      previewImage: "/themes/minimal/preview.svg",
      countdownDefault: 5,
    },
  ];

  for (const t of systemThemes) {
    await prisma.theme.upsert({
      where: { slug: t.slug },
      update: {
        name: t.name,
        description: t.description,
        config: t.config,
        status: ThemeStatus.ENABLED,
        isSystem: true,
      },
      create: {
        name: t.name,
        slug: t.slug,
        description: t.description,
        config: t.config,
        previewImage: t.previewImage,
        countdownDefault: t.countdownDefault,
        status: ThemeStatus.ENABLED,
        isSystem: true,
      },
    });
  }
  console.log(`✓ ${systemThemes.length} system themes ready`);

  // 4) Demo user (development only) ------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    const demoHash = await bcrypt.hash("Demo!2026", 12);
    const demo = await prisma.user.upsert({
      where: { email: "demo@trimly.app" },
      update: {},
      create: {
        name: "Demo User",
        email: "demo@trimly.app",
        passwordHash: demoHash,
        emailVerified: new Date(),
        status: "ACTIVE",
      },
    });

    const now = new Date();
    const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sub = await prisma.subscription.create({
      data: {
        userId: demo.id,
        plan: "PREMIUM_MONTHLY",
        status: "ACTIVE",
        priceInr: 90,
        startedAt: now,
        expiresAt: expires,
      },
    });
    await prisma.payment.create({
      data: {
        userId: demo.id,
        subscriptionId: sub.id,
        amount: 90,
        currency: "INR",
        status: "SUCCESS",
        method: "demo",
        cfPaymentId: `demo_${Date.now()}`,
        paymentTime: now,
      },
    });

    const aurora = await prisma.theme.findUnique({ where: { slug: "aurora" } });
    await prisma.shortLink.upsert({
      where: { slug: "welcome" },
      update: {},
      create: {
        userId: demo.id,
        slug: "welcome",
        destinationUrl: "https://nextjs.org",
        title: "Welcome to Trimly",
        themeId: aurora?.id,
        countdownSeconds: 5,
        clickCount: 12,
        uniqueCount: 8,
      },
    });
    console.log("✓ Demo user ready: demo@trimly.app / Demo!2026");
  }

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
