import { Module } from "@nestjs/common";
import { JournalMenusController, MenusController } from "./menus.controller";
import { MenusService } from "./menus.service";

@Module({
  controllers: [JournalMenusController, MenusController],
  providers: [MenusService],
  exports: [MenusService],
})
export class MenusModule {}
