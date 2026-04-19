import { IsEmail } from "class-validator";

export class ConfirmMockPaymentDto {
  @IsEmail()
  email!: string;
}
