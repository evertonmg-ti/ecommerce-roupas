import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { ObservabilityService } from "./observability.service";

@Controller("observability")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class ObservabilityController {
  constructor(private readonly observabilityService: ObservabilityService) {}

  @Get("events")
  listEvents(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("level") level?: string,
    @Query("search") search?: string
  ) {
    return this.observabilityService.listEvents({
      page,
      pageSize,
      level,
      search
    });
  }

  @Get("audit")
  listAuditLogs(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("search") search?: string
  ) {
    return this.observabilityService.listAdminAuditLogs({
      page,
      pageSize,
      search
    });
  }
}
