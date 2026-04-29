import {
  CanActivate,
  ExecutionContext,
  Injectable,
  TooManyRequestsException
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { EventLevel } from "@prisma/client";
import {
  RATE_LIMIT_KEY,
  RateLimitOptions
} from "../decorators/rate-limit.decorator";
import { ObservabilityService } from "../../modules/observability/observability.service";

type Bucket = {
  count: number;
  resetAt: number;
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, Bucket>();

  constructor(
    private readonly reflector: Reflector,
    private readonly observabilityService: ObservabilityService
  ) {}

  canActivate(context: ExecutionContext) {
    const config = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!config) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const ip = this.resolveIpAddress(request);
    const normalizedEmail =
      typeof request.body?.email === "string"
        ? request.body.email.trim().toLowerCase()
        : undefined;
    const routeName = config.keyPrefix ?? request.route?.path ?? request.path ?? "route";
    const routeKey = `${routeName}:${ip}:${normalizedEmail ?? "anonymous"}`;
    const now = Date.now();
    const existing = this.buckets.get(routeKey);

    if (this.buckets.size > 5000) {
      this.cleanupExpiredBuckets(now);
    }

    if (!existing || existing.resetAt <= now) {
      this.buckets.set(routeKey, {
        count: 1,
        resetAt: now + config.windowSec * 1000
      });
      return true;
    }

    if (existing.count >= config.limit) {
      void this.observabilityService.logEvent({
        type: "security.rate_limit_triggered",
        source: "rate-limit",
        level: EventLevel.SECURITY,
        message: `Limite excedido em ${routeName}.`,
        metadata: {
          route: routeName,
          ip,
          email: normalizedEmail,
          limit: config.limit,
          windowSec: config.windowSec
        }
      });
      throw new TooManyRequestsException(
        "Muitas tentativas seguidas. Aguarde e tente novamente."
      );
    }

    existing.count += 1;
    this.buckets.set(routeKey, existing);
    return true;
  }

  private resolveIpAddress(request: {
    headers?: Record<string, string | string[] | undefined>;
    ip?: string;
  }) {
    const forwardedFor = request.headers?.["x-forwarded-for"];

    if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
      return forwardedFor.split(",")[0].trim();
    }

    if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
      return forwardedFor[0];
    }

    return request.ip ?? "unknown";
  }

  private cleanupExpiredBuckets(now: number) {
    for (const [key, bucket] of this.buckets.entries()) {
      if (bucket.resetAt <= now) {
        this.buckets.delete(key);
      }
    }
  }
}
