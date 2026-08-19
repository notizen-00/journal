import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { UpsertMenuDto } from "./dto/upsert-menu.dto";

@Injectable()
export class MenusService {
  constructor(private readonly prisma: PrismaService) {}

  findAllForJournal(journalId: string) {
    return this.prisma.menu.findMany({
      where: { journalId },
      include: { items: { orderBy: { order: "asc" } } },
    });
  }

  async findOne(id: string) {
    const menu = await this.prisma.menu.findUnique({
      where: { id },
      include: { items: { orderBy: { order: "asc" } } },
    });
    if (!menu) throw new NotFoundException(`Menu ${id} not found`);
    return menu;
  }

  create(journalId: string, dto: UpsertMenuDto) {
    return this.prisma.menu.create({
      data: {
        journalId,
        name: dto.name,
        location: dto.location ?? "primary",
        items: dto.items
          ? { create: dto.items.map((item, index) => ({ ...item, order: item.order ?? index })) }
          : undefined,
      },
      include: { items: true },
    });
  }

  /** Replaces the item tree wholesale — simplest correct model for a menu editor. */
  async update(id: string, dto: UpsertMenuDto) {
    await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      await tx.menuItem.deleteMany({ where: { menuId: id } });
      return tx.menu.update({
        where: { id },
        data: {
          name: dto.name,
          location: dto.location,
          items: dto.items
            ? {
                create: dto.items.map((item, index) => ({
                  label: item.label,
                  url: item.url,
                  order: item.order ?? index,
                })),
              }
            : undefined,
        },
        include: { items: true },
      });
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.menu.delete({ where: { id } });
    return { id, deleted: true };
  }
}
