import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class DeploymentsService {
  constructor(private readonly prisma: PrismaService) {}

  findAllForJournal(journalId: string) {
    return this.prisma.deployment.findMany({
      where: { journalId },
      orderBy: { createdAt: "desc" },
      include: { build: true },
      take: 50,
    });
  }
}
