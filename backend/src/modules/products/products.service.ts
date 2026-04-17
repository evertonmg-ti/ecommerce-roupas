import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, ProductStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  listActive() {
    return this.prisma.product.findMany({
      where: { status: ProductStatus.ACTIVE },
      include: { category: true },
      orderBy: { createdAt: "desc" }
    });
  }

  listAll() {
    return this.prisma.product.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" }
    });
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: { category: true }
    });

    if (!product) {
      throw new NotFoundException("Produto nao encontrado.");
    }

    return product;
  }

  create(payload: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        ...payload,
        price: new Prisma.Decimal(payload.price),
        compareAt:
          payload.compareAt === undefined
            ? undefined
            : new Prisma.Decimal(payload.compareAt)
      }
    });
  }

  async update(id: string, payload: UpdateProductDto) {
    await this.ensureExists(id);

    return this.prisma.product.update({
      where: { id },
      data: {
        ...payload,
        price:
          payload.price === undefined
            ? undefined
            : new Prisma.Decimal(payload.price),
        compareAt:
          payload.compareAt === undefined
            ? undefined
            : new Prisma.Decimal(payload.compareAt)
      }
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    return this.prisma.product.delete({ where: { id } });
  }

  private async ensureExists(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });

    if (!product) {
      throw new NotFoundException("Produto nao encontrado.");
    }
  }
}

