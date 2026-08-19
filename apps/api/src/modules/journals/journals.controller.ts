import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateJournalDto } from "./dto/create-journal.dto";
import { UpdateJournalDto } from "./dto/update-journal.dto";
import { JournalsService } from "./journals.service";

@ApiTags("journals")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("journals")
export class JournalsController {
  constructor(private readonly journalsService: JournalsService) {}

  @Get()
  findAll() {
    return this.journalsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.journalsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateJournalDto) {
    return this.journalsService.create(dto);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdateJournalDto) {
    return this.journalsService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.journalsService.remove(id);
  }
}
