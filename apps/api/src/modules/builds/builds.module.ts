import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { QUEUE_STATIC_BUILD } from "../../config/queues";
import { BuildsController } from "./builds.controller";
import { BuildsService } from "./builds.service";

@Module({
  imports: [BullModule.registerQueue({ name: QUEUE_STATIC_BUILD })],
  controllers: [BuildsController],
  providers: [BuildsService],
  exports: [BuildsService],
})
export class BuildsModule {}
