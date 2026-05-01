import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const STYLES = [
  {
    slug: "low-fade-textured",
    name: "Low Fade · Textured Top",
    category: "fade",
    description: "Clean low fade with a tousled, textured crown.",
    overlayUrl: "https://res.cloudinary.com/demo/image/upload/v1/cutline/overlays/low-fade-textured.png",
    thumbnailUrl: "https://res.cloudinary.com/demo/image/upload/w_400,h_300,c_fill/sample.jpg",
    anchorTopRatio: 0.05,
    anchorScaleRatio: 1.55,
  },
  {
    slug: "mid-fade-pompadour",
    name: "Mid Fade · Pompadour",
    category: "fade",
    description: "Classic mid fade lifting into a polished pompadour.",
    overlayUrl: "https://res.cloudinary.com/demo/image/upload/v1/cutline/overlays/mid-fade-pomp.png",
    thumbnailUrl: "https://res.cloudinary.com/demo/image/upload/w_400,h_300,c_fill/sample.jpg",
    anchorTopRatio: 0.08,
    anchorScaleRatio: 1.6,
  },
  {
    slug: "high-skin-fade",
    name: "High Skin Fade",
    category: "fade",
    description: "Sharp skin fade up high with length kept on top.",
    overlayUrl: "https://res.cloudinary.com/demo/image/upload/v1/cutline/overlays/high-skin.png",
    thumbnailUrl: "https://res.cloudinary.com/demo/image/upload/w_400,h_300,c_fill/sample.jpg",
    anchorTopRatio: 0.0,
    anchorScaleRatio: 1.45,
  },
  {
    slug: "taper-classic",
    name: "Classic Taper",
    category: "taper",
    description: "Tapered sides, neat top — boardroom-ready.",
    overlayUrl: "https://res.cloudinary.com/demo/image/upload/v1/cutline/overlays/taper-classic.png",
    thumbnailUrl: "https://res.cloudinary.com/demo/image/upload/w_400,h_300,c_fill/sample.jpg",
    anchorTopRatio: 0.05,
    anchorScaleRatio: 1.5,
  },
  {
    slug: "buzz-2",
    name: "Buzz · Guard 2",
    category: "classic",
    description: "Clean #2 all over. Low-maintenance, unmissable jawline.",
    overlayUrl: "https://res.cloudinary.com/demo/image/upload/v1/cutline/overlays/buzz-2.png",
    thumbnailUrl: "https://res.cloudinary.com/demo/image/upload/w_400,h_300,c_fill/sample.jpg",
    anchorTopRatio: 0.0,
    anchorScaleRatio: 1.4,
  },
  {
    slug: "edge-up-design",
    name: "Edge-Up + Line Design",
    category: "design",
    description: "Razor-sharp edge-up with a custom hairline detail.",
    overlayUrl: "https://res.cloudinary.com/demo/image/upload/v1/cutline/overlays/edge-design.png",
    thumbnailUrl: "https://res.cloudinary.com/demo/image/upload/w_400,h_300,c_fill/sample.jpg",
    anchorTopRatio: 0.04,
    anchorScaleRatio: 1.5,
  },
];

const BARBERS = [
  {
    email: "brian@cuttingcartel.com",
    name: "Brian Williams",
    displayName: "Brian Williams",
    bio: "Founder of The Cutting Cartel. Dallas, TX. Known for skin fades and beard sculpts.",
    basePriceCents: 6500,
    slotMinutes: 45,
  },
  {
    email: "marcus@cuttingcartel.com",
    name: "Marcus J.",
    displayName: "Marcus J.",
    bio: "Specialist in textured tops and design work. 8 years on the chair.",
    basePriceCents: 5500,
    slotMinutes: 45,
  },
];

async function main() {
  console.log("→ Seeding hairstyles…");
  for (const s of STYLES) {
    await prisma.hairstyle.upsert({
      where: { slug: s.slug },
      update: s,
      create: s,
    });
  }

  console.log("→ Seeding barbers…");
  const passwordHash = await bcrypt.hash("changeme123", 12);
  for (const b of BARBERS) {
    const user = await prisma.user.upsert({
      where: { email: b.email },
      update: { name: b.name, role: "BARBER", passwordHash },
      create: { email: b.email, name: b.name, role: "BARBER", passwordHash },
    });
    await prisma.barber.upsert({
      where: { userId: user.id },
      update: {
        displayName: b.displayName,
        bio: b.bio,
        basePriceCents: b.basePriceCents,
        slotMinutes: b.slotMinutes,
        isActive: true,
      },
      create: {
        userId: user.id,
        displayName: b.displayName,
        bio: b.bio,
        basePriceCents: b.basePriceCents,
        slotMinutes: b.slotMinutes,
      },
    });
  }

  console.log("→ Seeding demo customer (demo@cuttingcartel.com / demo12345)…");
  const demoHash = await bcrypt.hash("demo12345", 12);
  await prisma.user.upsert({
    where: { email: "demo@cuttingcartel.com" },
    update: { name: "Demo Customer", passwordHash: demoHash },
    create: {
      email: "demo@cuttingcartel.com",
      name: "Demo Customer",
      role: "CUSTOMER",
      passwordHash: demoHash,
    },
  });

  console.log("✓ Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
