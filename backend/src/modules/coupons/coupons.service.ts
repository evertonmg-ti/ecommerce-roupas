import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { CouponType, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCouponDto } from "./dto/create-coupon.dto";
import { UpdateCouponDto } from "./dto/update-coupon.dto";
import { ValidateCouponDto } from "./dto/validate-coupon.dto";

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  listAll() {
    return this.prisma.coupon.findMany({
      orderBy: { createdAt: "desc" }
    });
  }

  async create(payload: CreateCouponDto) {
    const code = this.normalizeCode(payload.code);
    const existing = await this.prisma.coupon.findUnique({ where: { code } });

    if (existing) {
      throw new ConflictException("Ja existe um cupom com este codigo.");
    }

    return this.prisma.coupon.create({
      data: this.toPersistence(payload, code)
    });
  }

  async update(id: string, payload: UpdateCouponDto) {
    await this.ensureExists(id);
    const code = payload.code ? this.normalizeCode(payload.code) : undefined;

    if (code) {
      const existing = await this.prisma.coupon.findFirst({
        where: { code, id: { not: id } }
      });

      if (existing) {
        throw new ConflictException("Ja existe um cupom com este codigo.");
      }
    }

    return this.prisma.coupon.update({
      where: { id },
      data: this.toPersistence(payload, code)
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    return this.prisma.coupon.delete({ where: { id } });
  }

  async validate(payload: ValidateCouponDto) {
    const coupon = await this.getValidCouponOrThrow(payload.code, payload.subtotal);
    const discountAmount = this.calculateDiscount(
      coupon.type,
      coupon.value,
      new Prisma.Decimal(payload.subtotal)
    );

    return {
      id: coupon.id,
      code: coupon.code,
      description: coupon.description,
      discountAmount: discountAmount.toNumber()
    };
  }

  async resolveForOrder(code: string | undefined, subtotal: Prisma.Decimal) {
    if (!code) {
      return null;
    }

    const coupon = await this.getValidCouponOrThrow(code, subtotal.toNumber());
    const discountAmount = this.calculateDiscount(coupon.type, coupon.value, subtotal);

    return {
      couponId: coupon.id,
      couponCode: coupon.code,
      discountAmount
    };
  }

  incrementUsage(tx: Prisma.TransactionClient, couponId: string) {
    return tx.coupon.update({
      where: { id: couponId },
      data: {
        usedCount: {
          increment: 1
        }
      }
    });
  }

  private toPersistence(
    payload: Partial<CreateCouponDto>,
    normalizedCode = payload.code ? this.normalizeCode(payload.code) : undefined
  ) {
    return {
      code: normalizedCode,
      description: payload.description?.trim() || undefined,
      type: payload.type,
      value:
        payload.value === undefined ? undefined : new Prisma.Decimal(payload.value),
      active: payload.active,
      minSubtotal:
        payload.minSubtotal === undefined
          ? undefined
          : new Prisma.Decimal(payload.minSubtotal),
      usageLimit: payload.usageLimit,
      startsAt: payload.startsAt ? new Date(payload.startsAt) : undefined,
      expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : undefined
    };
  }

  private normalizeCode(code: string) {
    return code.trim().toUpperCase();
  }

  private async getValidCouponOrThrow(code: string, subtotal: number) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: this.normalizeCode(code) }
    });

    if (!coupon) {
      throw new NotFoundException("Cupom nao encontrado.");
    }

    if (!coupon.active) {
      throw new BadRequestException("Este cupom esta inativo.");
    }

    const now = new Date();

    if (coupon.startsAt && coupon.startsAt > now) {
      throw new BadRequestException("Este cupom ainda nao esta disponivel.");
    }

    if (coupon.expiresAt && coupon.expiresAt < now) {
      throw new BadRequestException("Este cupom expirou.");
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException("Este cupom ja atingiu o limite de uso.");
    }

    if (new Prisma.Decimal(subtotal).lt(coupon.minSubtotal)) {
      throw new BadRequestException("O subtotal minimo para este cupom nao foi atingido.");
    }

    return coupon;
  }

  private calculateDiscount(
    type: CouponType,
    value: Prisma.Decimal,
    subtotal: Prisma.Decimal
  ) {
    if (type === CouponType.PERCENTAGE) {
      return Prisma.Decimal.min(
        subtotal,
        subtotal.mul(value).div(new Prisma.Decimal(100))
      );
    }

    return Prisma.Decimal.min(subtotal, value);
  }

  private async ensureExists(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });

    if (!coupon) {
      throw new NotFoundException("Cupom nao encontrado.");
    }
  }
}
