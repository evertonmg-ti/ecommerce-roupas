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
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { CreateOrderDto } from "./dto/create-order.dto";
import { LookupOrdersDto } from "./dto/lookup-orders.dto";
import { OrdersService } from "./orders.service";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";

@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post("checkout")
  create(@Body() payload: CreateOrderDto) {
    return this.ordersService.create(payload);
  }

  @Post("lookup")
  lookup(@Body() payload: LookupOrdersDto) {
    return this.ordersService.listByCustomerEmail(payload);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  listCurrentUser(@CurrentUser() user: { id: string }) {
    return this.ordersService.listByUser(user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  listAll(@Query("status") status?: OrderStatus) {
    return this.ordersService.listAll(status);
  }

  @Patch(":id/status")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateStatus(@Param("id") id: string, @Body() payload: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, payload);
  }
}
