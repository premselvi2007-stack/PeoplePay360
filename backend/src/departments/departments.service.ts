import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.department.findMany({
      include: {
        _count: {
          select: {
            employees: true,
            jobPositions: true,
            contracts: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const dept = await this.prisma.department.findUnique({
      where: { id },
      include: {
        employees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            workEmail: true,
            status: true,
          },
        },
        jobPositions: true,
      },
    });
    if (!dept) throw new NotFoundException('Department not found');
    return dept;
  }

  async create(data: { name: string; code: string; managerId?: string }) {
    const existing = await this.prisma.department.findFirst({
      where: {
        OR: [{ name: data.name }, { code: data.code }],
      },
    });
    if (existing) throw new ConflictException('Department with this name or code already exists');

    return this.prisma.department.create({ data });
  }

  async update(id: string, data: { name?: string; code?: string; managerId?: string }) {
    await this.findOne(id);
    return this.prisma.department.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.department.delete({ where: { id } });
  }
}
