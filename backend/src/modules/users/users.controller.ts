import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards
} from "@nestjs/common";
import { Role } from "@prisma/client";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { CreateUserDto } from "./dto/create-user.dto";
import { SaveCurrentUserCartDto } from "./dto/save-current-user-cart.dto";
import { SaveCustomerAddressDto } from "./dto/save-customer-address.dto";
import { UpdateCurrentUserDto } from "./dto/update-current-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  listAll() {
    return this.usersService.listAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() payload: CreateUserDto) {
    return this.usersService.create(payload);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@CurrentUser() user: { id: string }) {
    return this.usersService.getCurrentUser(user.id);
  }

  @Patch("me")
  @UseGuards(JwtAuthGuard)
  updateCurrentUser(
    @CurrentUser() user: { id: string },
    @Body() payload: UpdateCurrentUserDto
  ) {
    return this.usersService.updateCurrentUser(user.id, payload);
  }

  @Get("me/addresses")
  @UseGuards(JwtAuthGuard)
  listCurrentUserAddresses(@CurrentUser() user: { id: string }) {
    return this.usersService.listCurrentUserAddresses(user.id);
  }

  @Get("me/cart")
  @UseGuards(JwtAuthGuard)
  getCurrentUserCart(@CurrentUser() user: { id: string }) {
    return this.usersService.getCurrentUserCart(user.id);
  }

  @Patch("me/cart")
  @UseGuards(JwtAuthGuard)
  replaceCurrentUserCart(
    @CurrentUser() user: { id: string },
    @Body() payload: SaveCurrentUserCartDto
  ) {
    return this.usersService.replaceCurrentUserCart(user.id, payload);
  }

  @Delete("me/cart")
  @UseGuards(JwtAuthGuard)
  clearCurrentUserCart(@CurrentUser() user: { id: string }) {
    return this.usersService.clearCurrentUserCart(user.id);
  }

  @Post("me/addresses")
  @UseGuards(JwtAuthGuard)
  createCurrentUserAddress(
    @CurrentUser() user: { id: string },
    @Body() payload: SaveCustomerAddressDto
  ) {
    return this.usersService.createCurrentUserAddress(user.id, payload);
  }

  @Patch("me/addresses/:addressId")
  @UseGuards(JwtAuthGuard)
  updateCurrentUserAddress(
    @CurrentUser() user: { id: string },
    @Param("addressId") addressId: string,
    @Body() payload: SaveCustomerAddressDto
  ) {
    return this.usersService.updateCurrentUserAddress(user.id, addressId, payload);
  }

  @Delete("me/addresses/:addressId")
  @UseGuards(JwtAuthGuard)
  removeCurrentUserAddress(
    @CurrentUser() user: { id: string },
    @Param("addressId") addressId: string
  ) {
    return this.usersService.removeCurrentUserAddress(user.id, addressId);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(@Param("id") id: string, @Body() payload: UpdateUserDto) {
    return this.usersService.update(id, payload);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param("id") id: string) {
    return this.usersService.remove(id);
  }
}
