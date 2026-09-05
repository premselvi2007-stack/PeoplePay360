/**
 * Safe Mathematical & Business Expression Evaluator
 * Strictly parses and executes arithmetic and logical expressions without using eval() or Function().
 */

export type TokenType =
  | 'NUMBER'
  | 'IDENTIFIER'
  | 'OPERATOR'
  | 'LPAREN'
  | 'RPAREN'
  | 'COMMA'
  | 'QUESTION'
  | 'COLON';

export interface Token {
  type: TokenType;
  value: string;
}

export class ExpressionEvaluator {
  /**
   * Tokenize an expression string into a stream of tokens.
   */
  public static tokenize(expr: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;
    const clean = expr.trim();

    while (i < clean.length) {
      const ch = clean[i];

      // Whitespace
      if (/\s/.test(ch)) {
        i++;
        continue;
      }

      // Numbers (integers or decimals)
      if (/\d/.test(ch) || (ch === '.' && /\d/.test(clean[i + 1] || ''))) {
        let numStr = '';
        while (i < clean.length && (/[\d.]/.test(clean[i]))) {
          numStr += clean[i];
          i++;
        }
        tokens.push({ type: 'NUMBER', value: numStr });
        continue;
      }

      // Identifiers (variable names, dot notation like contract.wage, function names)
      if (/[a-zA-Z_]/.test(ch)) {
        let idStr = '';
        while (i < clean.length && /[a-zA-Z0-9_.]/.test(clean[i])) {
          idStr += clean[i];
          i++;
        }
        tokens.push({ type: 'IDENTIFIER', value: idStr });
        continue;
      }

      // Multi-character operators: >=, <=, ==, !=
      if (
        (ch === '>' || ch === '<' || ch === '=' || ch === '!') &&
        clean[i + 1] === '='
      ) {
        tokens.push({ type: 'OPERATOR', value: ch + '=' });
        i += 2;
        continue;
      }

      // Single-character operators
      if (['+', '-', '*', '/', '%', '>', '<'].includes(ch)) {
        tokens.push({ type: 'OPERATOR', value: ch });
        i++;
        continue;
      }

      if (ch === '(') {
        tokens.push({ type: 'LPAREN', value: '(' });
        i++;
        continue;
      }

      if (ch === ')') {
        tokens.push({ type: 'RPAREN', value: ')' });
        i++;
        continue;
      }

      if (ch === ',') {
        tokens.push({ type: 'COMMA', value: ',' });
        i++;
        continue;
      }

      if (ch === '?') {
        tokens.push({ type: 'QUESTION', value: '?' });
        i++;
        continue;
      }

      if (ch === ':') {
        tokens.push({ type: 'COLON', value: ':' });
        i++;
        continue;
      }

      throw new Error(`Unexpected character '${ch}' at position ${i} in expression: "${expr}"`);
    }

    return tokens;
  }

  /**
   * Evaluates a mathematical expression given a variable context dictionary.
   */
  public static evaluate(expr: string, context: Record<string, number>): number {
    if (!expr || expr.trim() === '') {
      return 0;
    }

    const tokens = this.tokenize(expr);
    let pos = 0;

    function peek(): Token | undefined {
      return tokens[pos];
    }

    function consume(expectedType?: TokenType): Token {
      const token = tokens[pos];
      if (!token) {
        throw new Error('Unexpected end of expression');
      }
      if (expectedType && token.type !== expectedType) {
        throw new Error(`Expected token ${expectedType} but found ${token.type} ('${token.value}')`);
      }
      pos++;
      return token;
    }

    // Grammar:
    // Expression -> Ternary
    // Ternary    -> LogicalOr ('?' Ternary ':' Ternary)?
    // Comparison -> Additive (('>=' | '<=' | '==' | '!=' | '>' | '<') Additive)*
    // Additive   -> Multiplicative (('+' | '-') Multiplicative)*
    // Multiplicative -> Unary (('*' | '/' | '%') Unary)*
    // Unary      -> ('-' | '+') Unary | Primary
    // Primary    -> NUMBER | IDENTIFIER | IDENTIFIER '(' Args ')' | '(' Expression ')'

    function parseExpression(): number {
      return parseTernary();
    }

    function parseTernary(): number {
      let cond = parseComparison();
      if (peek()?.type === 'QUESTION') {
        consume('QUESTION');
        const trueBranch = parseTernary();
        consume('COLON');
        const falseBranch = parseTernary();
        return cond !== 0 ? trueBranch : falseBranch;
      }
      return cond;
    }

    function parseComparison(): number {
      let left = parseAdditive();
      while (
        peek()?.type === 'OPERATOR' &&
        ['>=', '<=', '==', '!=', '>', '<'].includes(peek()!.value)
      ) {
        const op = consume('OPERATOR').value;
        const right = parseAdditive();
        switch (op) {
          case '>=': left = left >= right ? 1 : 0; break;
          case '<=': left = left <= right ? 1 : 0; break;
          case '==': left = left === right ? 1 : 0; break;
          case '!=': left = left !== right ? 1 : 0; break;
          case '>':  left = left > right ? 1 : 0; break;
          case '<':  left = left < right ? 1 : 0; break;
        }
      }
      return left;
    }

    function parseAdditive(): number {
      let left = parseMultiplicative();
      while (
        peek()?.type === 'OPERATOR' &&
        (peek()!.value === '+' || peek()!.value === '-')
      ) {
        const op = consume('OPERATOR').value;
        const right = parseMultiplicative();
        if (op === '+') left += right;
        else if (op === '-') left -= right;
      }
      return left;
    }

    function parseMultiplicative(): number {
      let left = parseUnary();
      while (
        peek()?.type === 'OPERATOR' &&
        (peek()!.value === '*' || peek()!.value === '/' || peek()!.value === '%')
      ) {
        const op = consume('OPERATOR').value;
        const right = parseUnary();
        if (op === '*') {
          left *= right;
        } else if (op === '/') {
          if (right === 0) {
            left = 0; // Safe division by zero fallback
          } else {
            left /= right;
          }
        } else if (op === '%') {
          left = right !== 0 ? left % right : 0;
        }
      }
      return left;
    }

    function parseUnary(): number {
      if (peek()?.type === 'OPERATOR' && (peek()!.value === '-' || peek()!.value === '+')) {
        const op = consume('OPERATOR').value;
        const val = parseUnary();
        return op === '-' ? -val : val;
      }
      return parsePrimary();
    }

    function parsePrimary(): number {
      const token = peek();
      if (!token) {
        throw new Error('Unexpected end of input during parsing');
      }

      if (token.type === 'NUMBER') {
        consume('NUMBER');
        return parseFloat(token.value);
      }

      if (token.type === 'IDENTIFIER') {
        const idToken = consume('IDENTIFIER');
        const idName = idToken.value;

        // Check if function call e.g. min(a, b), max(a, b), round(a)
        if (peek()?.type === 'LPAREN') {
          consume('LPAREN');
          const args: number[] = [];
          if (peek()?.type !== 'RPAREN') {
            args.push(parseExpression());
            while (peek()?.type === 'COMMA') {
              consume('COMMA');
              args.push(parseExpression());
            }
          }
          consume('RPAREN');

          const fnLower = idName.toLowerCase();
          if (fnLower === 'min') return Math.min(...args);
          if (fnLower === 'max') return Math.max(...args);
          if (fnLower === 'round') {
            const decimals = args[1] || 2;
            const factor = Math.pow(10, decimals);
            return Math.round((args[0] || 0) * factor) / factor;
          }
          if (fnLower === 'abs') return Math.abs(args[0] || 0);
          if (fnLower === 'floor') return Math.floor(args[0] || 0);
          if (fnLower === 'ceil') return Math.ceil(args[0] || 0);
          if (fnLower === 'clamp') {
            const val = args[0] || 0;
            const min = args[1] !== undefined ? args[1] : 0;
            const max = args[2] !== undefined ? args[2] : val;
            return Math.min(Math.max(val, min), max);
          }

          throw new Error(`Unsupported salary rule function '${idName}'`);
        }

        // Variable lookup in context
        // Try exact match or upper/lowercase variations
        const normalizedKey = Object.keys(context).find(
          (k) => k.toLowerCase() === idName.toLowerCase()
        );

        if (normalizedKey !== undefined) {
          return context[normalizedKey] ?? 0;
        }

        // Variable is missing in context
        throw new Error(`Undefined variable '${idName}' referenced in formula "${expr}". Available variables: [${Object.keys(context).join(', ')}]`);
      }

      if (token.type === 'LPAREN') {
        consume('LPAREN');
        const val = parseExpression();
        consume('RPAREN');
        return val;
      }

      throw new Error(`Unexpected token '${token.value}' of type ${token.type}`);
    }

    const result = parseExpression();
    if (pos < tokens.length) {
      throw new Error(`Extra unparsed tokens at end of formula: "${expr}"`);
    }

    return isNaN(result) ? 0 : Number(result.toFixed(2));
  }
}
