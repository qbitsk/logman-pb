import { db } from "./index";
import { users, accounts, categories, workStations, workComponents, workDefects } from "./schema";
import { scryptAsync } from "@noble/hashes/scrypt.js";
import { eq } from "drizzle-orm";
import { workProducts } from "./schema/work-products";

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

  const existingProducts = await db.select().from(workProducts).limit(1);
  if (existingProducts.length > 0) {
    console.log("WorkProducts already exist. Skipping.");
  } else if (firstCategory.length > 0) {
    const categoryId = firstCategory[0].id;
    const [firstProduct] = await db
      .insert(workProducts)
      .values([
        { name: "Alu Had", categoryId, createdAt: now, updatedAt: now },
        { name: "Výklopný hák", categoryId, createdAt: now, updatedAt: now }
      ])
      .returning();
    console.log("WorkProducts seeded.");
  }

  const firstProduct = await db.select().from(workProducts).limit(1);

  // Seed WorkStations linked to the first work Product
  const existingStations = await db.select().from(workStations).limit(1);
  if (existingStations.length > 0) {
    console.log("WorkStations already exist. Skipping.");
  } else if (firstProduct.length > 0) {
    const workProductId = firstProduct[0].id;
    await db.insert(workStations).values([
      { name: "Stanica 1", workProductId, createdAt: now, updatedAt: now },
      { name: "Stanica 2", workProductId, createdAt: now, updatedAt: now },
      { name: "Stanica 3", workProductId, createdAt: now, updatedAt: now },
    ]);
    console.log("WorkStations seeded.");
  }

  // Seed WorkComponents linked to the first work Category
  const existingComponents = await db.select().from(workComponents).limit(1);
  if (existingComponents.length > 0) {
    console.log("WorkComponents already exist. Skipping.");
  } else if (firstProduct.length > 0) {
    const workProductId = firstProduct[0].id;
    const [firstComponent] = await db
      .insert(workComponents)
      .values([
        { name: "Hák", workProductId, createdAt: now, updatedAt: now },
        { name: "Plech", workProductId, createdAt: now, updatedAt: now },
        { name: "Kolík", workProductId, createdAt: now, updatedAt: now },
        { name: "Ložisko", workProductId, createdAt: now, updatedAt: now },
      ])
      .returning();
    console.log("WorkComponents seeded.");
  }

  // Seed WorkDefects (catalog) linked to the first work Product
  const firstComponent = await db.select().from(workComponents).limit(1);
  const existingWorkDefects = await db.select().from(workDefects).limit(1);
  if (existingWorkDefects.length > 0) {
    console.log("WorkDefects already exist. Skipping.");
  } else if (firstProduct.length > 0) {
    const workProductId = firstProduct[0].id;
    const workComponentId = firstComponent[0].id
    await db.insert(workDefects).values([
      { name: "Deformácia", type: "component", workProductId, workComponentId, createdAt: now, updatedAt: now },
      { name: "Zlý rozmer", type: "component", workProductId, workComponentId, createdAt: now, updatedAt: now },
      { name: "Škrabance", type: "component", workProductId, workComponentId, createdAt: now, updatedAt: now },
      { name: "Zlé zanitovanie", type: "unit", workProductId, createdAt: now, updatedAt: now },
      { name: "Prasknuté ložisko", type: "unit", workProductId, createdAt: now, updatedAt: now },
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
