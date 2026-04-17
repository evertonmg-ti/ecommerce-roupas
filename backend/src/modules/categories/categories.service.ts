import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  listAll() {
    return this.prisma.category.findMany({
      orderBy: { name: "asc" }
    });
  }

  async create(payload: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { slug: payload.slug }
    });

    if (existing) {
      throw new ConflictException("Ja existe uma categoria com este slug.");
    }

    return this.prisma.category.create({
      data: payload
    });
  }

  async update(id: string, payload: UpdateCategoryDto) {
    await this.ensureExists(id);

    if (payload.slug) {
      const existing = await this.prisma.category.findFirst({
        where: {
          slug: payload.slug,
          id: { not: id }
        }
      });

      if (existing) {
        throw new ConflictException("Ja existe uma categoria com este slug.");
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: payload
    });
  }

  async remove(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    });

    if (!category) {
      throw new NotFoundException("Categoria nao encontrada.");
    }

    if (category._count.products > 0) {
      throw new ConflictException(
        "Nao e possivel excluir uma categoria com produtos vinculados."
      );
    }

    return this.prisma.category.delete({
      where: { id }
    });
  }

  private async ensureExists(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id }
    });

    if (!category) {
      throw new NotFoundException("Categoria nao encontrada.");
    }
  }
}
