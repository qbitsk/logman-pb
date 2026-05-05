import { db } from "./index";
import { users, accounts, categories, productionStations, productionComponents, productionDefects } from "./schema";
import { scryptAsync } from "@noble/hashes/scrypt.js";
import { eq } from "drizzle-orm";
import { productionProducts } from "./schema/production-products";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "Admin1234!";
const ADMIN_NAME = process.env.SEED_ADMIN_NAME ?? "Admin";

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hashPassword(password: string): Promise<string> {
  const saltBytes = new Uint8Array(16);
  crypto.getRandomValues(saltBytes);
  const salt = toHex(saltBytes);
  const key = await scryptAsync(password.normalize("NFKC"), salt, {
    N: 16384,
    r: 16,
    p: 1,
    dkLen: 64,
    maxmem: 128 * 16384 * 16 * 2,
  });
  return `${salt}:${toHex(key)}`;
}

async function seed() {
  const now = new Date();

  // Seed default Categories
  const existingCategory = await db.select().from(categories).limit(1);
  if (existingCategory.length > 0) {
    console.log("Category already exists. Skipping.");
  } else {
    
    await db.insert(categories).values({
      id: crypto.randomUUID(),
      name: "Montáž",
      type: "product",
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(categories).values({
      id: crypto.randomUUID(),
      name: "Lisovanie",
      type: "product",
      createdAt: now,
      updatedAt: now,
    });
    console.log("Default categories seeded.");
  }

   // Seed WorkProducts linked to the first Category
  const firstCategory = await db.select().from(categories).where(eq(categories.type, "product" as const)).limit(1);

  const existingProducts = await db.select().from(productionProducts).limit(1);
  if (existingProducts.length > 0) {
    console.log("WorkProducts already exist. Skipping.");
  } else if (firstCategory.length > 0) {
    const categoryId = firstCategory[0].id;
    const [firstProduct] = await db
      .insert(productionProducts)
      .values([
        { name: "Alu Had", categoryId, createdAt: now, updatedAt: now },
        { name: "Výklopný hák", categoryId, createdAt: now, updatedAt: now }
      ])
      .returning();
    console.log("WorkProducts seeded.");
  }

  const firstProduct = await db.select().from(productionProducts).limit(1);

  // Seed WorkStations linked to the first work Product
  const existingStations = await db.select().from(productionStations).limit(1);
  if (existingStations.length > 0) {
    console.log("WorkStations already exist. Skipping.");
  } else if (firstProduct.length > 0) {
    const productionProductId = firstProduct[0].id;
    await db.insert(productionStations).values([
      { name: "Stanica 1", productionProductId, createdAt: now, updatedAt: now },
      { name: "Stanica 2", productionProductId, createdAt: now, updatedAt: now },
      { name: "Stanica 3", productionProductId, createdAt: now, updatedAt: now },
    ]);
    console.log("WorkStations seeded.");
  }

  // Seed WorkComponents linked to the first work Product
  const existingComponents = await db.select().from(productionComponents).limit(1);
  if (existingComponents.length > 0) {
    console.log("WorkComponents already exist. Skipping.");
  } else if (firstProduct.length > 0) {
    const productionProductId = firstProduct[0].id;
    const [firstComponent] = await db
      .insert(productionComponents)
      .values([
        { name: "Hák", productionProductId, createdAt: now, updatedAt: now },
        { name: "Plech", productionProductId, createdAt: now, updatedAt: now },
        { name: "Kolík", productionProductId, createdAt: now, updatedAt: now },
        { name: "Ložisko", productionProductId, createdAt: now, updatedAt: now },
      ])
      .returning();
    console.log("WorkComponents seeded.");
  }

  // Seed WorkDefects (catalog) linked to the first work Product
  const firstComponent = await db.select().from(productionComponents).limit(1);
  const existingWorkDefects = await db.select().from(productionDefects).limit(1);
  if (existingWorkDefects.length > 0) {
    console.log("WorkDefects already exist. Skipping.");
  } else if (firstProduct.length > 0) {
    const productionProductId = firstProduct[0].id;
    const productionComponentId = firstComponent[0].id
    await db.insert(productionDefects).values([
      { name: "Deformácia", type: "component", productionProductId, productionComponentId, createdAt: now, updatedAt: now },
      { name: "Zlý rozmer", type: "component", productionProductId, productionComponentId, createdAt: now, updatedAt: now },
      { name: "Škrabance", type: "component", productionProductId, productionComponentId, createdAt: now, updatedAt: now },
      { name: "Zlé zanitovanie", type: "unit", productionProductId, createdAt: now, updatedAt: now },
      { name: "Prasknuté ložisko", type: "unit", productionProductId, createdAt: now, updatedAt: now },
    ]);
    console.log("WorkDefects seeded.");
  }

  console.log(`Seeding admin user: ${ADMIN_EMAIL}`);

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, ADMIN_EMAIL))
    .limit(1);

  if (existing.length > 0) {
    console.log("Admin user already exists. Skipping.");
  } else {
    const id = crypto.randomUUID();
    const hashedPassword = await hashPassword(ADMIN_PASSWORD);

    await db.insert(users).values({
      id,
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      emailVerified: true,
      role: "admin",
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(accounts).values({
      id: crypto.randomUUID(),
      accountId: ADMIN_EMAIL,
      providerId: "credential",
      userId: id,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    });

    console.log("Admin user created successfully.");
  }

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
