import { prisma } from "../../config/prisma"

export interface ChatMessageRecord {
  id: string
  userId: string
  role: string
  content: string
  widget: string | null
  mode: string
  createdAt: Date
}

export class ChatRepository {
  async save(userId: string, role: string, content: string, widget: string | null, mode: string): Promise<ChatMessageRecord> {
    const row = await prisma.chatMessage.create({
      data: { userId, role, content, widget, mode },
    })
    return row as ChatMessageRecord
  }

  async findByUserId(userId: string, mode?: string, limit = 100): Promise<ChatMessageRecord[]> {
    const where: Record<string, unknown> = { userId }
    if (mode) where.mode = mode
    const rows = await prisma.chatMessage.findMany({
      where: where as any,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    return rows as ChatMessageRecord[]
  }

  async deleteById(id: string, userId: string): Promise<void> {
    await prisma.chatMessage.deleteMany({ where: { id, userId } })
  }

  async clearByUserId(userId: string, mode?: string): Promise<void> {
    const where: Record<string, unknown> = { userId }
    if (mode) where.mode = mode
    await prisma.chatMessage.deleteMany({ where: where as any })
  }
}