import { prisma } from "../../config/prisma"
import type { IChatRepository } from "../../core/domain/repositories"

export class ChatRepository implements IChatRepository {
  async save(message: { userId: string; role: string; content: string }): Promise<{ id: string; userId: string; role: string; content: string; createdAt: Date }> {
    const row = await prisma.chatMessage.create({
      data: { userId: message.userId, role: message.role, content: message.content, mode: "GLOBAL" },
    })
    return row
  }

  async findByUserId(userId: string, limit = 100): Promise<Array<{ id: string; userId: string; role: string; content: string; createdAt: Date }>> {
    const rows = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    })
    return rows
  }

  async clearByUserId(userId: string): Promise<void> {
    await prisma.chatMessage.deleteMany({ where: { userId } })
  }
}
