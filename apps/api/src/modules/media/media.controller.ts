import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { memoryStorage } from "multer";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { MediaService } from "./media.service";

@ApiTags("media")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("journals/:journalId/media")
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  findAll(@Param("journalId") journalId: string) {
    return this.mediaService.findAllForJournal(journalId);
  }

  @Post()
  @UseInterceptors(FileInterceptor("file", { storage: memoryStorage() }))
  upload(@Param("journalId") journalId: string, @UploadedFile() file: Express.Multer.File) {
    return this.mediaService.upload(journalId, file);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.mediaService.remove(id);
  }
}
