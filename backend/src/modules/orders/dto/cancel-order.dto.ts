import { IsEmail } from "class-validator";

export class CancelOrderDto {
  @IsEmail()
  email!: string;
}
