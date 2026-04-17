import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  listAll() {
    return this.prisma.category.findMany({
      orderBy: { name: "asc" }
    });
  }
}

