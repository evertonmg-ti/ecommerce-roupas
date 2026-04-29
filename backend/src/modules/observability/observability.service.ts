import { Injectable, Logger } from "@nestjs/common";
import { EventLevel, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

type LogEventInput = {
  type: string;
  level?: EventLevel;
  source: string;
  message: string;
  metadata?: Prisma.InputJsonValue;
};

type LogAdminAuditInput = {
  actorUserId?: string;
  actorEmail?: string;
  actorName?: string;
  actorRole?: string;
  method: string;
  path: string;
  action: string;
  entityType?: string;
  entityId?: string;
  statusCode?: number;
  ipAddress?: string;
  payload?: Prisma.InputJsonValue;
};

@Injectable()
export class ObservabilityService {
  private readonly logger = new Logger(ObservabilityService.name);

  constructor(private readonly prisma: PrismaService) {}

  async logEvent(input: LogEventInput) {
    try {
      await this.prisma.systemEvent.create({
        data: {
          type: input.type,
          level: input.level ?? EventLevel.INFO,
          source: input.source,
          message: input.message,
          metadata: input.metadata
        }
      });
    } catch (error) {
      this.logger.error(
        `Falha ao persistir evento ${input.type}: ${error instanceof Error ? error.message : "erro desconhecido"}`
      );
    }
  }

  async logAdminAudit(input: LogAdminAuditInput) {
    try {
      await this.prisma.adminAuditLog.create({
        data: {
          actorUserId: input.actorUserId,
          actorEmail: input.actorEmail,
          actorName: input.actorName,
          actorRole: input.actorRole,
          method: input.method,
          path: input.path,
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId,
          statusCode: input.statusCode,
          ipAddress: input.ipAddress,
          payload: input.payload
        }
      });
    } catch (error) {
      this.logger.error(
        `Falha ao persistir auditoria admin ${input.action}: ${error instanceof Error ? error.message : "erro desconhecido"}`
      );
    }
  }

  async listEvents(filters?: {
    page?: string;
    pageSize?: string;
    level?: string;
    search?: string;
  }) {
    const page = this.parsePositiveInteger(filters?.page, 1);
    const pageSize = Math.min(this.parsePositiveInteger(filters?.pageSize, 20), 100);
    const skip = (page - 1) * pageSize;
    const where = this.buildEventWhere(filters?.level, filters?.search);
    const [total, items] = await this.prisma.$transaction([
      this.prisma.systemEvent.count({ where }),
      this.prisma.systemEvent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize
      })
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    };
  }

  async listAdminAuditLogs(filters?: {
    page?: string;
    pageSize?: string;
    search?: string;
  }) {
    const page = this.parsePositiveInteger(filters?.page, 1);
    const pageSize = Math.min(this.parsePositiveInteger(filters?.pageSize, 20), 100);
    const skip = (page - 1) * pageSize;
    const where = this.buildAuditWhere(filters?.search);
    const [total, items] = await this.prisma.$transaction([
      this.prisma.adminAuditLog.count({ where }),
      this.prisma.adminAuditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize
      })
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    };
  }

  sanitizePayload(value: unknown): Prisma.InputJsonValue | undefined {
    if (value === undefined) {
      return undefined;
    }

    return this.sanitizeValue(value) as Prisma.InputJsonValue;
  }

  private sanitizeValue(value: unknown): unknown {
    if (value === null || typeof value === "number" || typeof value === "boolean") {
      return value;
    }

    if (typeof value === "string") {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.sanitizeValue(item));
    }

    if (typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, fieldValue]) => [
          key,
          this.isSensitiveField(key) ? "[REDACTED]" : this.sanitizeValue(fieldValue)
        ])
      );
    }

    return String(value);
  }

  private isSensitiveField(key: string) {
    const normalized = key.toLowerCase();
    return (
      normalized.includes("password") ||
      normalized.includes("token") ||
      normalized.includes("smtpPass".toLowerCase()) ||
      normalized.includes("secret")
    );
  }

  private buildEventWhere(level?: string, search?: string): Prisma.SystemEventWhereInput | undefined {
    const normalizedLevel =
      level && Object.values(EventLevel).includes(level as EventLevel)
        ? (level as EventLevel)
        : undefined;
    const normalizedSearch = search?.trim();

    if (!normalizedLevel && !normalizedSearch) {
      return undefined;
    }

    return {
      ...(normalizedLevel ? { level: normalizedLevel } : {}),
      ...(normalizedSearch
        ? {
            OR: [
              {
                type: {
                  contains: normalizedSearch,
                  mode: "insensitive"
                }
              },
              {
                source: {
                  contains: normalizedSearch,
                  mode: "insensitive"
                }
              },
              {
                message: {
                  contains: normalizedSearch,
                  mode: "insensitive"
                }
              }
            ]
          }
        : {})
    };
  }

  private buildAuditWhere(search?: string): Prisma.AdminAuditLogWhereInput | undefined {
    const normalizedSearch = search?.trim();

    if (!normalizedSearch) {
      return undefined;
    }

    return {
      OR: [
        {
          actorEmail: {
            contains: normalizedSearch,
            mode: "insensitive"
          }
        },
        {
          actorName: {
            contains: normalizedSearch,
            mode: "insensitive"
          }
        },
        {
          path: {
            contains: normalizedSearch,
            mode: "insensitive"
          }
        },
        {
          action: {
            contains: normalizedSearch,
            mode: "insensitive"
          }
        }
      ]
    };
  }

  private parsePositiveInteger(value: string | undefined, fallback: number) {
    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed < 1) {
      return fallback;
    }

    return Math.trunc(parsed);
  }
}
