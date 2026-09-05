import { NotFoundException, BadRequestException, ConflictException, ForbiddenException, UnauthorizedException } from '../common/errors';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaClient } from '@prisma/client';

export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaClient) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req) => {
          if (req && req.cookies && req.cookies.jwt) {
            return req.cookies.jwt;
          }
          return null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'peoplepay360-hackathon-secure-super-jwt-secret-key-2026',
    });
  }

  async validate(payload: { sub: string; email: string; role: string; employeeId?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        employee: {
          include: {
            department: true,
            jobPosition: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User account is invalid or inactive');
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
