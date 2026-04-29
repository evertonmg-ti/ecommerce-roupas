import { IsEmail } from "class-validator";

export class CreateBackInStockSubscriptionDto {
  @IsEmail()
  email!: string;
}
