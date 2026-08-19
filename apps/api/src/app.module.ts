import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { JournalsModule } from "./modules/journals/journals.module";
import { PagesModule } from "./modules/pages/pages.module";
import { MenusModule } from "./modules/menus/menus.module";
import { MediaModule } from "./modules/media/media.module";
import { ThemesModule } from "./modules/themes/themes.module";
import { ArticlesModule } from "./modules/articles/articles.module";
import { IssuesModule } from "./modules/issues/issues.module";
import { SyncModule } from "./modules/sync/sync.module";
import { BuildsModule } from "./modules/builds/builds.module";
import { DeploymentsModule } from "./modules/deployments/deployments.module";
import { PublicModule } from "./modules/public/public.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? "localhost",
        port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
      },
    }),
    PrismaModule,
    AuthModule,
    JournalsModule,
    PagesModule,
    MenusModule,
    MediaModule,
    ThemesModule,
    ArticlesModule,
    IssuesModule,
    SyncModule,
    BuildsModule,
    DeploymentsModule,
    PublicModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
