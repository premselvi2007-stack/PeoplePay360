import {
  ComputedRuleLine,
  RuleEngineContext,
  RuleEngineResult,
  SalaryRuleDefinition,
} from './interfaces';
import { ExpressionEvaluator } from './expression-evaluator';

export class RuleEngineService {
  

  /**
   * Execute sequenced salary rules for an employee within a given payroll context.
   */
  public executeRules(
    rules: SalaryRuleDefinition[],
    payrollContext: RuleEngineContext,
  ): RuleEngineResult {
    const warnings: string[] = [];
    const lines: ComputedRuleLine[] = [];

    // Filter active rules and sort strictly by sequence ascending
    const activeRules = rules
      .filter((r) => r.isActive)
      .sort((a, b) => a.sequence - b.sequence);

    if (activeRules.length === 0) {
      warnings.push('Salary structure contains no active salary rules.');
    }

    // Build the dynamic variable context
    const context: Record<string, number> = {
      WAGE: payrollContext.contractWage || 0,
      'contract.wage': payrollContext.contractWage || 0,
      worked_days: payrollContext.workedDays || 0,
      expected_working_days: payrollContext.expectedWorkingDays || 22,
      expected_hours: payrollContext.expectedHours || 176,
      actual_worked_hours: payrollContext.actualWorkedHours || 176,
      worked_hours: payrollContext.actualWorkedHours || 176,
      unpaid_leave_days: payrollContext.unpaidLeaveDays || 0,
      paid_leave_days: payrollContext.paidLeaveDays || 0,
      overtime_hours: payrollContext.overtimeHours || 0,
      ...(payrollContext.variables || {}),
    };

    let calculatedBasic = 0;
    let calculatedAllowances = 0;
    let calculatedGross = 0;
    let calculatedDeductions = 0;
    let calculatedNet = 0;
    let explicitGrossRulePresent = false;
    let explicitNetRulePresent = false;

    // Check for duplicate rule codes
    const seenCodes = new Set<string>();
    for (const rule of activeRules) {
      if (seenCodes.has(rule.code.toUpperCase())) {
        warnings.push(`Duplicate rule code detected: ${rule.code}. Later rule will overwrite previous value.`);
      }
      seenCodes.add(rule.code.toUpperCase());
    }

    for (const rule of activeRules) {
      let amount = 0;
      let rateOrBase = 0;
      let formulaSnapshot = '';

      try {
        // Optional condition check
        if (rule.condition && rule.condition.trim().length > 0) {
          const conditionPassed = ExpressionEvaluator.evaluate(rule.condition, context);
          if (!conditionPassed) {
            lines.push({
              ruleCode: rule.code,
              ruleName: rule.name,
              category: rule.category,
              sequence: rule.sequence,
              computationType: rule.computationType,
              rateOrBase: 0,
              amount: 0,
              formulaSnapshot: `Condition not met: (${rule.condition})`,
            });
            context[rule.code] = 0;
            context[rule.code.toLowerCase()] = 0;
            continue;
          }
        }

        switch (rule.computationType) {
          case 'FIXED': {
            amount = rule.fixedAmount ?? 0;
            rateOrBase = amount;
            formulaSnapshot = `Fixed: ${amount}`;
            break;
          }

          case 'PERCENTAGE': {
            const baseVar = (rule.percentageOf || 'BASIC').trim();
            const pct = rule.percentage ?? 0;
            const baseVal =
              context[baseVar] ??
              context[baseVar.toUpperCase()] ??
              context[baseVar.toLowerCase()] ??
              (baseVar === 'BASIC' ? context['WAGE'] : 0);

            rateOrBase = baseVal;
            amount = Number(((pct / 100) * baseVal).toFixed(2));
            formulaSnapshot = `${pct}% of ${baseVar} (${baseVal})`;
            break;
          }

          case 'FORMULA': {
            const rawFormula = rule.formula || '0';
            amount = ExpressionEvaluator.evaluate(rawFormula, context);
            rateOrBase = amount;
            formulaSnapshot = rawFormula;
            break;
          }

          default: {
            amount = 0;
            formulaSnapshot = 'Unknown computation type';
          }
        }

        // Store into calculation context for subsequent rules
        context[rule.code] = amount;
        context[rule.code.toUpperCase()] = amount;
        context[rule.code.toLowerCase()] = amount;

        // Categorize totals
        const categoryUpper = rule.category ? rule.category.toUpperCase() : 'BASIC';
        if (categoryUpper === 'BASIC') {
          calculatedBasic = amount;
        } else if (categoryUpper === 'ALLOWANCE') {
          calculatedAllowances += amount;
        } else if (categoryUpper === 'GROSS') {
          calculatedGross = amount;
          explicitGrossRulePresent = true;
        } else if (categoryUpper === 'DEDUCTION') {
          calculatedDeductions += amount;
        } else if (categoryUpper === 'NET') {
          calculatedNet = amount;
          explicitNetRulePresent = true;
        }

        lines.push({
          ruleCode: rule.code,
          ruleName: rule.name,
          category: rule.category,
          sequence: rule.sequence,
          computationType: rule.computationType,
          rateOrBase: Number(rateOrBase.toFixed(2)),
          amount: Number(amount.toFixed(2)),
          formulaSnapshot,
        });
      } catch (err: any) {
        const errorMsg = `Rule [${rule.code}] (${rule.name}) execution failed: ${err.message}`;
        console.warn(errorMsg);
        warnings.push(errorMsg);

        lines.push({
          ruleCode: rule.code,
          ruleName: rule.name,
          category: rule.category,
          sequence: rule.sequence,
          computationType: rule.computationType,
          rateOrBase: 0,
          amount: 0,
          formulaSnapshot: `ERROR: ${err.message}`,
        });
        context[rule.code] = 0;
      }
    }

    // Derive gross if not explicitly calculated by a GROSS rule
    if (!explicitGrossRulePresent) {
      calculatedGross = Number((calculatedBasic + calculatedAllowances).toFixed(2));
    }

    // Derive net if not explicitly calculated by a NET rule
    if (!explicitNetRulePresent) {
      calculatedNet = Number((calculatedGross - calculatedDeductions).toFixed(2));
    }

    // Warning for negative salary
    if (calculatedNet < 0) {
      warnings.push(`Calculated Net Salary is negative (${calculatedNet}). Please verify deductions.`);
    }

    return {
      lines,
      totals: {
        basic: Number(calculatedBasic.toFixed(2)),
        allowances: Number(calculatedAllowances.toFixed(2)),
        gross: Number(calculatedGross.toFixed(2)),
        deductions: Number(calculatedDeductions.toFixed(2)),
        net: Number(calculatedNet.toFixed(2)),
      },
      warnings,
    };
  }
}
