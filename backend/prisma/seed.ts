import { PrismaClient, ProductStatus, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@fashionstore.com" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@fashionstore.com",
      passwordHash,
      role: Role.ADMIN
    }
  });

  const category = await prisma.category.upsert({
    where: { slug: "camisetas" },
    update: {},
    create: {
      name: "Camisetas",
      slug: "camisetas",
      description: "Linha casual e premium"
    }
  });

  await prisma.product.upsert({
    where: { slug: "camiseta-essentials-off-white" },
    update: {},
    create: {
      name: "Camiseta Essentials Off White",
      slug: "camiseta-essentials-off-white",
      description: "Malha premium com caimento solto e toque macio.",
      price: 149.9,
      compareAt: 189.9,
      stock: 25,
      status: ProductStatus.ACTIVE,
      imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
      categoryId: category.id
    }
  });

  console.log({ adminEmail: admin.email });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
