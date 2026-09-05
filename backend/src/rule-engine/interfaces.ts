import { ComputationType, RuleCategory } from '../common/types';

export interface SalaryRuleDefinition {
  id: string;
  name: string;
  code: string;
  category: RuleCategory | string;
  sequence: number;
  computationType: ComputationType | string;
  fixedAmount?: number | null;
  percentage?: number | null;
  percentageOf?: string | null;
  formula?: string | null;
  condition?: string | null;
  isActive: boolean;
}

export interface RuleEngineContext {
  contractWage: number;
  workedDays: number;
  expectedWorkingDays: number;
  expectedHours: number;
  actualWorkedHours: number;
  unpaidLeaveDays: number;
  paidLeaveDays: number;
  overtimeHours: number;
  variables: Record<string, number>;
}

export interface ComputedRuleLine {
  ruleCode: string;
  ruleName: string;
  category: RuleCategory | string;
  sequence: number;
  computationType: ComputationType | string;
  rateOrBase: number;
  amount: number;
  formulaSnapshot: string;
}

export interface RuleEngineResult {
  lines: ComputedRuleLine[];
  totals: {
    basic: number;
    allowances: number;
    gross: number;
    deductions: number;
    net: number;
  };
  warnings: string[];
}
