import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor
} from "@nestjs/common";
import { Observable, catchError, tap, throwError } from "rxjs";
import { ObservabilityService } from "./observability.service";

@Injectable()
export class AdminAuditInterceptor implements NestInterceptor {
  constructor(private readonly observabilityService: ObservabilityService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== "http") {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<{
      method: string;
      originalUrl?: string;
      path?: string;
      body?: unknown;
      params?: Record<string, string>;
      headers?: Record<string, string | string[] | undefined>;
      ip?: string;
      user?: {
        id?: string;
        email?: string;
        name?: string;
        role?: string;
      };
    }>();
    const response = context.switchToHttp().getResponse<{ statusCode?: number }>();

    const method = request.method?.toUpperCase();
    const isMutating = method === "POST" || method === "PATCH" || method === "DELETE";
    const isAdmin = request.user?.role === "ADMIN";

    if (!isMutating || !isAdmin) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        void this.observabilityService.logAdminAudit({
          actorUserId: request.user?.id,
          actorEmail: request.user?.email,
          actorName: request.user?.name,
          actorRole: request.user?.role,
          method,
          path: request.originalUrl ?? request.path ?? "",
          action: `${method} ${request.originalUrl ?? request.path ?? ""}`,
          entityType: this.resolveEntityType(request.originalUrl ?? request.path ?? ""),
          entityId: request.params?.id,
          statusCode: response.statusCode ?? 200,
          ipAddress: this.resolveIpAddress(request),
          payload: this.observabilityService.sanitizePayload(request.body)
        });
      }),
      catchError((error: { status?: number; statusCode?: number }) => {
        void this.observabilityService.logAdminAudit({
          actorUserId: request.user?.id,
          actorEmail: request.user?.email,
          actorName: request.user?.name,
          actorRole: request.user?.role,
          method,
          path: request.originalUrl ?? request.path ?? "",
          action: `${method} ${request.originalUrl ?? request.path ?? ""}`,
          entityType: this.resolveEntityType(request.originalUrl ?? request.path ?? ""),
          entityId: request.params?.id,
          statusCode: error.status ?? error.statusCode ?? response.statusCode ?? 500,
          ipAddress: this.resolveIpAddress(request),
          payload: this.observabilityService.sanitizePayload(request.body)
        });

        return throwError(() => error);
      })
    );
  }

  private resolveEntityType(path: string) {
    const normalized = path.split("?")[0] ?? "";
    const segments = normalized.split("/").filter(Boolean);
    const apiIndex = segments.findIndex((segment) => segment === "v1");
    const entitySegment =
      apiIndex >= 0 ? segments[apiIndex + 1] : segments[segments.length - 1];

    if (!entitySegment) {
      return undefined;
    }

    return entitySegment;
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
}
