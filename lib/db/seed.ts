import { db } from "./index";
import { users, accounts, workCategories, workStations, workComponents, workComponentDefectCategories } from "./schema";
import { scryptAsync } from "@noble/hashes/scrypt.js";
import { eq } from "drizzle-orm";

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

  // Seed a default WorkCategory
  const existingCategory = await db.select().from(workCategories).limit(1);
  if (existingCategory.length > 0) {
    console.log("WorkCategory already exists. Skipping.");
  } else {
    
    await db.insert(workCategories).values({
      id: crypto.randomUUID(),
      name: "Výklopný hák",
      type: "assembly",
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(workCategories).values({
      id: crypto.randomUUID(),
      name: "Alu Had",
      type: "assembly",
      createdAt: now,
      updatedAt: now,
    });
    console.log("Default WorkCategory seeded.");
  }

  // Seed WorkComponents linked to the first WorkCategory
  const firstCategory = await db.select().from(workCategories).limit(1);
  const existingComponents = await db.select().from(workComponents).limit(1);
  if (existingComponents.length > 0) {
    console.log("WorkComponents already exist. Skipping.");
  } else if (firstCategory.length > 0) {
    const workCategoryId = firstCategory[0].id;
    const [firstComponent] = await db
      .insert(workComponents)
      .values({ name: "Komponent 1", workCategoryId, createdAt: now, updatedAt: now })
      .returning();
    await db.insert(workComponentDefectCategories).values([
      { name: "Vada 1", workComponentId: firstComponent.id, createdAt: now, updatedAt: now },
      { name: "Vada 2", workComponentId: firstComponent.id, createdAt: now, updatedAt: now },
      { name: "Vada 3", workComponentId: firstComponent.id, createdAt: now, updatedAt: now },
    ]);
    console.log("WorkComponents and WorkComponentDefectCategories seeded.");
  }

  // Seed WorkStations linked to the first WorkCategory
  const existingStations = await db.select().from(workStations).limit(1);
  if (existingStations.length > 0) {
    console.log("WorkStations already exist. Skipping.");
  } else if (firstCategory.length > 0) {
    const workCategoryId = firstCategory[0].id;
    await db.insert(workStations).values([
      { name: "Stroj 1", workCategoryId, createdAt: now, updatedAt: now },
      { name: "Stroj 2", workCategoryId, createdAt: now, updatedAt: now },
      { name: "Stroj 3", workCategoryId, createdAt: now, updatedAt: now },
    ]);
    console.log("WorkStations seeded.");
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

  process.exit(1);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
