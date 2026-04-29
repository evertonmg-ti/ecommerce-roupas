import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { CreateBackInStockSubscriptionDto } from "./dto/create-back-in-stock-subscription.dto";
import { SaveAbandonedCartDto } from "./dto/save-abandoned-cart.dto";
import { EngagementService } from "./engagement.service";

@Controller("engagement")
export class EngagementController {
  constructor(private readonly engagementService: EngagementService) {}

  @Post("abandoned-carts")
  saveAbandonedCart(@Body() payload: SaveAbandonedCartDto) {
    return this.engagementService.saveAbandonedCart(payload);
  }

  @Get("abandoned-carts/:token")
  getAbandonedCart(@Param("token") token: string) {
    return this.engagementService.getAbandonedCartByToken(token);
  }

  @Get("admin/abandoned-carts")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  listAbandonedCarts() {
    return this.engagementService.listAbandonedCarts();
  }

  @Get("admin/back-in-stock")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  listBackInStockSubscriptions() {
    return this.engagementService.listBackInStockSubscriptions();
  }

  @Post("products/:productId/back-in-stock")
  subscribeBackInStock(
    @Param("productId") productId: string,
    @Body() payload: CreateBackInStockSubscriptionDto
  ) {
    return this.engagementService.subscribeBackInStock(productId, payload);
  }
}
