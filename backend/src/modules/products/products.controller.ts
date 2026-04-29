import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards
} from "@nestjs/common";
import { Role } from "@prisma/client";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { AdjustStockDto } from "./dto/adjust-stock.dto";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ValidateCartDto } from "./dto/validate-cart.dto";
import { ProductsService } from "./products.service";

@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  listActive(
    @Query("search") search?: string,
    @Query("category") category?: string,
    @Query("sort") sort?: string
  ) {
    return this.productsService.listActive({ search, category, sort });
  }

  @Get("admin")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  listAll(
    @Query("search") search?: string,
    @Query("status") status?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string
  ) {
    return this.productsService.listAll({ search, status, page, pageSize });
  }

  @Get("admin/inventory-movements")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  listInventoryMovements(
    @Query("search") search?: string,
    @Query("type") type?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string
  ) {
    return this.productsService.listInventoryMovements({
      search,
      type,
      page,
      pageSize
    });
  }

  @Get(":slug")
  findBySlug(@Param("slug") slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Post("availability")
  checkAvailability(@Body() payload: ValidateCartDto) {
    return this.productsService.checkAvailability(payload);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() payload: CreateProductDto) {
    return this.productsService.create(payload);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(
    @Param("id") id: string,
    @Body() payload: UpdateProductDto,
    @CurrentUser() user?: { id?: string; email?: string; name?: string; role?: string }
  ) {
    return this.productsService.update(id, payload, user);
  }

  @Post(":id/stock-adjustments")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  adjustStock(
    @Param("id") id: string,
    @Body() payload: AdjustStockDto,
    @CurrentUser() user?: { id?: string; email?: string; name?: string; role?: string }
  ) {
    return this.productsService.adjustStock(id, payload, user);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param("id") id: string) {
    return this.productsService.remove(id);
  }
}
