import { Body, Controller, Post } from "@nestjs/common";
import { RateLimit } from "../../common/decorators/rate-limit.decorator";
import { AuthService } from "./auth.service";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @RateLimit({ limit: 10, windowSec: 300, keyPrefix: "auth-register" })
  register(@Body() payload: RegisterDto) {
    return this.authService.register(payload);
  }

  @Post("login")
  @RateLimit({ limit: 10, windowSec: 60, keyPrefix: "auth-login" })
  login(@Body() payload: LoginDto) {
    return this.authService.login(payload);
  }

  @Post("forgot-password")
  @RateLimit({ limit: 5, windowSec: 300, keyPrefix: "auth-forgot-password" })
  forgotPassword(@Body() payload: ForgotPasswordDto) {
    return this.authService.forgotPassword(payload);
  }

  @Post("reset-password")
  @RateLimit({ limit: 10, windowSec: 300, keyPrefix: "auth-reset-password" })
  resetPassword(@Body() payload: ResetPasswordDto) {
    return this.authService.resetPassword(payload);
  }
}
