import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { UpsertMenuDto } from "./dto/upsert-menu.dto";
import { MenusService } from "./menus.service";

@ApiTags("menus")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("journals/:journalId/menus")
export class JournalMenusController {
  constructor(private readonly menusService: MenusService) {}

  @Get()
  findAll(@Param("journalId") journalId: string) {
    return this.menusService.findAllForJournal(journalId);
  }

  @Post()
  create(@Param("journalId") journalId: string, @Body() dto: UpsertMenuDto) {
    return this.menusService.create(journalId, dto);
  }
}

@ApiTags("menus")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("menus")
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.menusService.findOne(id);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpsertMenuDto) {
    return this.menusService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.menusService.remove(id);
  }
}
