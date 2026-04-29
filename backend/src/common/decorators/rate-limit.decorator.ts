import { SetMetadata } from "@nestjs/common";

export const RATE_LIMIT_KEY = "rate_limit";

export type RateLimitOptions = {
  limit: number;
  windowSec: number;
  keyPrefix?: string;
};

export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);
