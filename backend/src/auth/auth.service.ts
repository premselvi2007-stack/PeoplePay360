import { NotFoundException, BadRequestException, ConflictException, ForbiddenException, UnauthorizedException } from '../common/errors';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

export class AuthService {
  constructor(
    private prisma: PrismaClient,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        employee: {
          include: {
            department: true,
            jobPosition: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Email or password is incorrect');
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Email or password is incorrect');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated. Contact HR/Admin.');
    }

    return user;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
    };

    const token = this.jwtService.sign(payload);

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        employee: user.employee,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: registerDto.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new ConflictException('A user with this email address already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(registerDto.password, salt);

    // Create employee record
    const empCount = await this.prisma.employee.count();
    const employeeCode = `EMP-${String(empCount + 1).padStart(4, '0')}`;

    const employee = await this.prisma.employee.create({
      data: {
        employeeCode,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        workEmail: registerDto.email.toLowerCase().trim(),
        status: 'ACTIVE',
      },
    });

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email.toLowerCase().trim(),
        passwordHash,
        role: (registerDto.role as any) || 'EMPLOYEE',
        employeeId: employee.id,
      },
      include: {
        employee: true,
      },
    });

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
    };

    const token = this.jwtService.sign(payload);

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        employee: user.employee,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        employee: {
          include: {
            department: true,
            jobPosition: true,
            workingSchedule: true,
            contracts: {
              where: { status: 'RUNNING' },
              include: { salaryStructure: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
      employee: user.employee,
    };
  }
}
