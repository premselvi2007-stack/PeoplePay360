import { PrismaClient } from '@prisma/client';

export class AuditService {
  constructor(private prisma: PrismaClient) {}

  async log(data: {
    userId?: string;
    payrunId?: string;
    entityType: string;
    entityId: string;
    action: string;
    previousState?: any;
    newState?: any;
    metadata?: any;
    ipAddress?: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        userId: data.userId,
        payrunId: data.payrunId,
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        previousState: data.previousState ? JSON.stringify(data.previousState) : null,
        newState: data.newState ? JSON.stringify(data.newState) : null,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        ipAddress: data.ipAddress,
      },
    });
  }

  async findAll(entityType?: string, entityId?: string) {
    return this.prisma.auditLog.findMany({
      where: {
        entityType: entityType || undefined,
        entityId: entityId || undefined,
      },
      include: {
        user: {
          select: { id: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
