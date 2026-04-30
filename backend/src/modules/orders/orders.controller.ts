import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards
} from "@nestjs/common";
import { OrderStatus, Role } from "@prisma/client";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RateLimit } from "../../common/decorators/rate-limit.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { CreateOrderDto } from "./dto/create-order.dto";
import { CreateReturnRequestDto } from "./dto/create-return-request.dto";
import { CalculateShippingDto } from "./dto/calculate-shipping.dto";
import { CancelOrderDto } from "./dto/cancel-order.dto";
import { ConfirmMockPaymentDto } from "./dto/confirm-mock-payment.dto";
import { LookupOrdersDto } from "./dto/lookup-orders.dto";
import { OrdersService } from "./orders.service";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";
import { UpdateReturnRequestStatusDto } from "./dto/update-return-request-status.dto";

@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post("checkout")
  @RateLimit({ limit: 20, windowSec: 60, keyPrefix: "orders-checkout" })
  create(@Body() payload: CreateOrderDto) {
    return this.ordersService.create(payload);
  }

  @Post("lookup")
  @RateLimit({ limit: 20, windowSec: 60, keyPrefix: "orders-lookup" })
  lookup(@Body() payload: LookupOrdersDto) {
    return this.ordersService.listByCustomerEmail(payload);
  }

  @Post("shipping-quote")
  @RateLimit({ limit: 60, windowSec: 60, keyPrefix: "orders-shipping-quote" })
  calculateShipping(@Body() payload: CalculateShippingDto) {
    return this.ordersService.calculateShipping(payload);
  }

  @Post(":id/mock-payment/confirm")
  @RateLimit({ limit: 10, windowSec: 60, keyPrefix: "orders-mock-payment-confirm" })
  confirmMockPayment(
    @Param("id") id: string,
    @Body() payload: ConfirmMockPaymentDto
  ) {
    return this.ordersService.confirmMockPayment(id, payload);
  }

  @Post(":id/cancel")
  @RateLimit({ limit: 10, windowSec: 60, keyPrefix: "orders-cancel" })
  cancelOrder(@Param("id") id: string, @Body() payload: CancelOrderDto) {
    return this.ordersService.cancelByCustomer(id, payload);
  }

  @Post(":id/return-requests")
  @UseGuards(JwtAuthGuard)
  @RateLimit({ limit: 10, windowSec: 300, keyPrefix: "orders-return-request" })
  createReturnRequest(
    @Param("id") id: string,
    @CurrentUser() user: { id: string },
    @Body() payload: CreateReturnRequestDto
  ) {
    return this.ordersService.createReturnRequest(id, user.id, payload);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  listCurrentUser(@CurrentUser() user: { id: string }) {
    return this.ordersService.listByUser(user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  listAll(
    @Query("status") status?: OrderStatus,
    @Query("search") search?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string
  ) {
    return this.ordersService.listAll({
      status,
      search,
      page,
      pageSize
    });
  }

  @Get("return-requests/admin")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  listAdminReturnRequests(
    @Query("status") status?: string,
    @Query("type") type?: string,
    @Query("priority") priority?: string,
    @Query("search") search?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string
  ) {
    return this.ordersService.listAdminReturnRequests({
      status,
      type,
      priority,
      search,
      page,
      pageSize
    });
  }

  @Patch(":id/status")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateStatus(@Param("id") id: string, @Body() payload: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, payload);
  }

  @Patch(":orderId/return-requests/:requestId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateReturnRequestStatus(
    @Param("orderId") orderId: string,
    @Param("requestId") requestId: string,
    @CurrentUser() user: { id: string },
    @Body() payload: UpdateReturnRequestStatusDto
  ) {
    return this.ordersService.updateReturnRequestStatus(orderId, requestId, payload, user.id);
  }
}
