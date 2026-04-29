import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AuthModule } from "./modules/auth/auth.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { CouponsModule } from "./modules/coupons/coupons.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { EmailModule } from "./modules/email/email.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { PrismaModule } from "./modules/prisma/prisma.module";
import { ProductsModule } from "./modules/products/products.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    CategoriesModule,
    CouponsModule,
    EmailModule,
    UsersModule,
    ProductsModule,
    OrdersModule,
    DashboardModule
  ],
  controllers: [AppController]
})
export class AppModule {}
