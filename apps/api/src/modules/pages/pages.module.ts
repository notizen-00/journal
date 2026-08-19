import { Module } from "@nestjs/common";
import { JournalPagesController, PagesController } from "./pages.controller";
import { PagesService } from "./pages.service";

@Module({
  controllers: [JournalPagesController, PagesController],
  providers: [PagesService],
  exports: [PagesService],
})
export class PagesModule {}
