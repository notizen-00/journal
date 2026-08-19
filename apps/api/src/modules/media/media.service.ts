import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { S3Service } from "./s3.service";

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
  ) {}

  findAllForJournal(journalId: string) {
    return this.prisma.media.findMany({
      where: { journalId },
      orderBy: { createdAt: "desc" },
    });
  }

  async upload(journalId: string, file: Express.Multer.File) {
    const { url } = await this.s3.upload(journalId, file);
    return this.prisma.media.create({
      data: {
        journalId,
        fileName: file.originalname,
        url,
        mimeType: file.mimetype,
        size: file.size,
      },
    });
  }

  async remove(id: string) {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) throw new NotFoundException(`Media ${id} not found`);
    await this.prisma.media.delete({ where: { id } });
    return { id, deleted: true };
  }
}
