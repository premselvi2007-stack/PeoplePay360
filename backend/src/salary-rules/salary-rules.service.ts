import { NotFoundException, BadRequestException, ConflictException, ForbiddenException, UnauthorizedException } from '../common/errors';
import { PrismaClient } from '@prisma/client';
import { RuleEngineService } from '../rule-engine/rule-engine.service';
import { ExpressionEvaluator } from '../rule-engine/expression-evaluator';

export interface CreateSalaryRuleInput {
  salaryStructureId: string;
  name: string;
  code: string;
  category: string; // BASIC, ALLOWANCE, GROSS, DEDUCTION, NET
  sequence: number;
  computationType: string; // FIXED, PERCENTAGE, FORMULA
  fixedAmount?: number;
  percentage?: number;
  percentageOf?: string;
  formula?: string;
  condition?: string;
  isActive?: boolean;
}

export interface TestRuleCalculationInput {
  salaryStructureId?: string;
  rules?: CreateSalaryRuleInput[];
  contractWage: number;
  workedDays?: number;
  expectedWorkingDays?: number;
  unpaidLeaveDays?: number;
  paidLeaveDays?: number;
  overtimeHours?: number;
}

export class SalaryRulesService {
  constructor(
    private prisma: PrismaClient,
    private ruleEngineService: RuleEngineService,
  ) {}

  async findAll(salaryStructureId?: string) {
    return this.prisma.salaryRule.findMany({
      where: salaryStructureId ? { salaryStructureId } : undefined,
      include: {
        salaryStructure: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: [{ salaryStructureId: 'asc' }, { sequence: 'asc' }],
    });
  }

  async findOne(id: string) {
    const rule = await this.prisma.salaryRule.findUnique({
      where: { id },
      include: { salaryStructure: true },
    });
    if (!rule) throw new NotFoundException('Salary rule not found');
    return rule;
  }

  async create(data: CreateSalaryRuleInput) {
    const cleanCode = data.code.trim().toUpperCase();

    // Validate formula syntax if formula type
    if (data.computationType === 'FORMULA' && data.formula) {
      try {
        ExpressionEvaluator.tokenize(data.formula);
      } catch (err: any) {
        throw new BadRequestException(`Invalid formula expression: ${err.message}`);
      }
    }

    const existing = await this.prisma.salaryRule.findFirst({
      where: {
        salaryStructureId: data.salaryStructureId,
        code: cleanCode,
      },
    });

    if (existing) {
      throw new ConflictException(`A salary rule with code "${cleanCode}" already exists in this structure`);
    }

    return this.prisma.salaryRule.create({
      data: {
        salaryStructureId: data.salaryStructureId,
        name: data.name,
        code: cleanCode,
        category: data.category || 'BASIC',
        sequence: Number(data.sequence) || 10,
        computationType: data.computationType || 'FIXED',
        fixedAmount: data.fixedAmount !== undefined ? Number(data.fixedAmount) : 0,
        percentage: data.percentage !== undefined ? Number(data.percentage) : 0,
        percentageOf: data.percentageOf ? data.percentageOf.trim().toUpperCase() : null,
        formula: data.formula,
        condition: data.condition,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
      include: { salaryStructure: true },
    });
  }

  async update(id: string, data: Partial<CreateSalaryRuleInput>) {
    await this.findOne(id);

    if (data.computationType === 'FORMULA' && data.formula) {
      try {
        ExpressionEvaluator.tokenize(data.formula);
      } catch (err: any) {
        throw new BadRequestException(`Invalid formula expression: ${err.message}`);
      }
    }

    return this.prisma.salaryRule.update({
      where: { id },
      data: {
        ...data,
        code: data.code ? data.code.trim().toUpperCase() : undefined,
        percentageOf: data.percentageOf ? data.percentageOf.trim().toUpperCase() : undefined,
        sequence: data.sequence !== undefined ? Number(data.sequence) : undefined,
        fixedAmount: data.fixedAmount !== undefined ? Number(data.fixedAmount) : undefined,
        percentage: data.percentage !== undefined ? Number(data.percentage) : undefined,
      },
      include: { salaryStructure: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.salaryRule.delete({ where: { id } });
  }

  /**
   * Test sandbox calculation using live or draft rules
   */
  async testCalculation(input: TestRuleCalculationInput) {
    let rulesToExecute: any[] = [];

    if (input.salaryStructureId) {
      rulesToExecute = await this.prisma.salaryRule.findMany({
        where: { salaryStructureId: input.salaryStructureId, isActive: true },
        orderBy: { sequence: 'asc' },
      });
    } else if (input.rules && input.rules.length > 0) {
      rulesToExecute = input.rules.map((r, idx) => ({
        id: `mock-${idx}`,
        ...r,
        isActive: r.isActive !== undefined ? r.isActive : true,
      }));
    } else {
      throw new BadRequestException('Either salaryStructureId or rules array must be provided');
    }

    const context = {
      contractWage: Number(input.contractWage) || 50000,
      workedDays: input.workedDays ?? 22,
      expectedWorkingDays: input.expectedWorkingDays ?? 22,
      expectedHours: 176,
      actualWorkedHours: (input.workedDays ?? 22) * 8,
      unpaidLeaveDays: input.unpaidLeaveDays ?? 0,
      paidLeaveDays: input.paidLeaveDays ?? 0,
      overtimeHours: input.overtimeHours ?? 0,
      variables: {},
    };

    return this.ruleEngineService.executeRules(rulesToExecute, context);
  }
}
