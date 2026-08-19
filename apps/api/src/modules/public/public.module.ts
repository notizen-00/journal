import { Module } from "@nestjs/common";
import { InternalTokenGuard } from "./internal-token.guard";
import { PublicController } from "./public.controller";

@Module({
  controllers: [PublicController],
  providers: [InternalTokenGuard],
})
export class PublicModule {}
