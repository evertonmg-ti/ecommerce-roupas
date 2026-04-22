import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, ProductStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  listActive(filters?: { search?: string; category?: string; sort?: string }) {
    const search = filters?.search?.trim();
    const category = filters?.category?.trim();
    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.ACTIVE,
      ...(category
        ? {
            category: {
              slug: category
            }
          }
        : {}),
      ...(search
        ? {
            OR: [
              {
                name: {
                  contains: search,
                  mode: "insensitive"
                }
              },
              {
                description: {
                  contains: search,
                  mode: "insensitive"
                }
              }
            ]
          }
        : {})
    };

    return this.prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: this.resolvePublicSort(filters?.sort)
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

  private resolvePublicSort(sort?: string): Prisma.ProductOrderByWithRelationInput {
    switch (sort) {
      case "price_asc":
        return { price: "asc" };
      case "price_desc":
        return { price: "desc" };
      case "name_asc":
        return { name: "asc" };
      case "newest":
      default:
        return { createdAt: "desc" };
    }
  }
}
