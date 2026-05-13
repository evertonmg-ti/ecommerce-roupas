import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { CreateBackInStockSubscriptionDto } from "./dto/create-back-in-stock-subscription.dto";
import { SaveAbandonedCartDto } from "./dto/save-abandoned-cart.dto";
import { SendSegmentCampaignDto } from "./dto/send-segment-campaign.dto";
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

  @Post("admin/abandoned-carts/:id/resend")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  resendAbandonedCartReminder(@Param("id") id: string) {
    return this.engagementService.resendAbandonedCartReminder(id);
  }

  @Post("admin/abandoned-carts/campaigns/:stage/send")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  triggerAbandonedCartCampaign(@Param("stage") stage: string) {
    return this.engagementService.triggerAbandonedCartCampaign(
      stage === "THIRD_TOUCH" ? "THIRD_TOUCH" : "SECOND_TOUCH"
    );
  }

  @Get("admin/back-in-stock")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  listBackInStockSubscriptions() {
    return this.engagementService.listBackInStockSubscriptions();
  }

  @Get("admin/wallet-reminders")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  listDormantWalletCustomers() {
    return this.engagementService.listDormantWalletCustomers();
  }

  @Post("admin/wallet-reminders/:userId/send")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  sendWalletBalanceReminder(@Param("userId") userId: string) {
    return this.engagementService.sendWalletBalanceReminder(userId);
  }

  @Post("admin/wallet-reminders/campaigns/:segment/send")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  triggerWalletReminderCampaign(@Param("segment") segment: string) {
    return this.engagementService.triggerWalletReminderCampaign(
      segment === "DORMANT_30_DAYS" ? "DORMANT_30_DAYS" : "DORMANT_7_DAYS"
    );
  }

  @Get("admin/customer-segments")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  listCustomerSegments() {
    return this.engagementService.listCustomerSegments();
  }

  @Post("admin/customer-segments/send")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  sendSegmentCampaign(@Body() payload: SendSegmentCampaignDto) {
    return this.engagementService.sendSegmentCampaign(payload);
  }

  @Post("products/:productId/back-in-stock")
  subscribeBackInStock(
    @Param("productId") productId: string,
    @Body() payload: CreateBackInStockSubscriptionDto
  ) {
    return this.engagementService.subscribeBackInStock(productId, payload);
  }
}
