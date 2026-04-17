import { IsEmail } from "class-validator";

export class LookupOrdersDto {
  @IsEmail()
  email!: string;
}
