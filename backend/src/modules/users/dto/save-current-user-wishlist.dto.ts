import { ArrayMinSize, IsArray, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

class SaveCurrentUserWishlistItemDto {
  @IsString()
  productId!: string;
}

export class SaveCurrentUserWishlistDto {
  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => SaveCurrentUserWishlistItemDto)
  items!: SaveCurrentUserWishlistItemDto[];
}
