import { NotFoundException, BadRequestException, ConflictException, ForbiddenException, UnauthorizedException } from '../common/errors';
import { PrismaClient } from '@prisma/client';

export class JobPositionsService {
  constructor(private prisma: PrismaClient) {}

  async findAll(departmentId?: string) {
    return this.prisma.jobPosition.findMany({
      where: departmentId ? { departmentId } : undefined,
      include: {
        department: true,
        _count: {
          select: { employees: true, contracts: true },
        },
      },
      orderBy: { title: 'asc' },
    });
  }

  async findOne(id: string) {
    const pos = await this.prisma.jobPosition.findUnique({
      where: { id },
      include: { department: true, employees: true },
    });
    if (!pos) throw new NotFoundException('Job position not found');
    return pos;
  }

  async create(data: {
    title: string;
    code: string;
    departmentId: string;
    expectedSalaryMin?: number;
    expectedSalaryMax?: number;
  }) {
    const existing = await this.prisma.jobPosition.findUnique({
      where: { code: data.code },
    });
    if (existing) throw new ConflictException('Job position with this code already exists');

    return this.prisma.jobPosition.create({ data });
  }

  async update(
    id: string,
    data: {
      title?: string;
      code?: string;
      departmentId?: string;
      expectedSalaryMin?: number;
      expectedSalaryMax?: number;
    },
  ) {
    await this.findOne(id);
    return this.prisma.jobPosition.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.jobPosition.delete({ where: { id } });
  }
}
