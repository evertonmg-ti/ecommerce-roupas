import { Module } from "@nestjs/common";
import { CouponsModule } from "../coupons/coupons.module";
import { EmailModule } from "../email/email.module";
import { ProductsModule } from "../products/products.module";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";

@Module({
  imports: [CouponsModule, EmailModule, ProductsModule],
  controllers: [OrdersController],
  providers: [OrdersService]
})
export class OrdersModule {}
