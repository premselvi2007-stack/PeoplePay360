import { NotFoundException, BadRequestException, ConflictException, ForbiddenException, UnauthorizedException } from '../common/errors';
import { PrismaClient } from '@prisma/client';

export class SalaryStructuresService {
  constructor(private prisma: PrismaClient) {}

  async findAll() {
    return this.prisma.salaryStructure.findMany({
      include: {
        rules: {
          orderBy: { sequence: 'asc' },
        },
        _count: {
          select: {
            rules: true,
            contracts: true,
            payruns: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const struct = await this.prisma.salaryStructure.findUnique({
      where: { id },
      include: {
        rules: {
          orderBy: { sequence: 'asc' },
        },
        contracts: {
          where: { status: 'RUNNING' },
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeCode: true,
                workEmail: true,
              },
            },
          },
        },
        _count: {
          select: {
            rules: true,
            contracts: true,
            payruns: true,
          },
        },
      },
    });
    if (!struct) throw new NotFoundException('Salary Structure not found');
    return struct;
  }

  async create(data: { name: string; code: string; description?: string; isActive?: boolean }) {
    const existing = await this.prisma.salaryStructure.findFirst({
      where: {
        OR: [{ name: data.name }, { code: data.code.toUpperCase() }],
      },
    });
    if (existing) throw new ConflictException('A salary structure with this name or code already exists');

    return this.prisma.salaryStructure.create({
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
        description: data.description,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
      include: { rules: true },
    });
  }

  async update(id: string, data: { name?: string; code?: string; description?: string; isActive?: boolean }) {
    await this.findOne(id);
    return this.prisma.salaryStructure.update({
      where: { id },
      data: {
        ...data,
        code: data.code ? data.code.toUpperCase() : undefined,
      },
      include: {
        rules: {
          orderBy: { sequence: 'asc' },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.salaryStructure.delete({ where: { id } });
  }
}
