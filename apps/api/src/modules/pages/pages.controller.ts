import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreatePageDto } from "./dto/create-page.dto";
import { UpdatePageDto } from "./dto/update-page.dto";
import { PagesService } from "./pages.service";

@ApiTags("pages")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("journals/:journalId/pages")
export class JournalPagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Get()
  findAll(@Param("journalId") journalId: string) {
    return this.pagesService.findAllForJournal(journalId);
  }

  @Post()
  create(@Param("journalId") journalId: string, @Body() dto: CreatePageDto) {
    return this.pagesService.create(journalId, dto);
  }
}

@ApiTags("pages")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("pages")
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.pagesService.findOne(id);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdatePageDto) {
    return this.pagesService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.pagesService.remove(id);
  }

  @Post(":id/publish")
  publish(@Param("id") id: string) {
    return this.pagesService.publish(id);
  }

  @Post(":id/rollback/:version")
  rollback(@Param("id") id: string, @Param("version", ParseIntPipe) version: number) {
    return this.pagesService.rollback(id, version);
  }
}
