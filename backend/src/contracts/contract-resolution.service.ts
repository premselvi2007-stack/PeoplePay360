import { PrismaClient } from '@prisma/client';

export interface ContractResolutionResult {
  contract: any | null;
  isValid: boolean;
  warning?: string;
  isBlocking: boolean;
}

export class ContractResolutionService {
  

  constructor(private prisma: PrismaClient) {}

  /**
   * Resolves the single valid contract for an employee applicable to a specific payroll period.
   * Period: [periodStart, periodEnd]
   */
  async resolveContractForPeriod(
    employeeId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<ContractResolutionResult> {
    const contracts = await this.prisma.contract.findMany({
      where: {
        employeeId,
        status: { in: ['RUNNING', 'EXPIRED'] }, // Allow expired if the historical period fell within its validity
        startDate: { lte: periodEnd },
        OR: [
          { endDate: null },
          { endDate: { gte: periodStart } },
        ],
      },
      include: {
        salaryStructure: {
          include: {
            rules: {
              where: { isActive: true },
              orderBy: { sequence: 'asc' },
            },
          },
        },
        department: true,
        jobPosition: true,
      },
      orderBy: { startDate: 'desc' },
    });

    if (contracts.length === 0) {
      return {
        contract: null,
        isValid: false,
        warning: `No active or valid contract found for period ${periodStart.toISOString().split('T')[0]} to ${periodEnd.toISOString().split('T')[0]}.`,
        isBlocking: true,
      };
    }

    if (contracts.length > 1) {
      // Check if there are multiple active/running contracts overlapping this period
      const runningContracts = contracts.filter((c) => c.status === 'RUNNING');
      if (runningContracts.length > 1) {
        return {
          contract: contracts[0],
          isValid: false,
          warning: `Conflict: Found ${runningContracts.length} overlapping RUNNING contracts for this period (${runningContracts.map((c) => c.contractReference).join(', ')}). Please resolve contract validity dates.`,
          isBlocking: true,
        };
      }
    }

    const resolved = contracts[0];
    if (!resolved.salaryStructureId) {
      return {
        contract: resolved,
        isValid: false,
        warning: `Contract ${resolved.contractReference} has no Salary Structure assigned.`,
        isBlocking: true,
      };
    }

    return {
      contract: resolved,
      isValid: true,
      isBlocking: false,
    };
  }

  /**
   * Check for overlapping contract periods when creating/updating a contract.
   */
  async validateContractOverlap(
    employeeId: string,
    startDate: Date,
    endDate: Date | null,
    excludeContractId?: string,
  ): Promise<{ hasOverlap: boolean; conflictingContract?: any }> {
    const activeContracts = await this.prisma.contract.findMany({
      where: {
        employeeId,
        id: excludeContractId ? { not: excludeContractId } : undefined,
        status: { in: ['RUNNING', 'DRAFT'] },
      },
    });

    for (const contract of activeContracts) {
      const cStart = new Date(contract.startDate);
      const cEnd = contract.endDate ? new Date(contract.endDate) : null;

      // Check overlap: [startDate, endDate || Infinity] intersects [cStart, cEnd || Infinity]
      const overlapStart = cStart <= (endDate || new Date(8640000000000000));
      const overlapEnd = (cEnd || new Date(8640000000000000)) >= startDate;

      if (overlapStart && overlapEnd) {
        return { hasOverlap: true, conflictingContract: contract };
      }
    }

    return { hasOverlap: false };
  }
}
