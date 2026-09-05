/**
 * HTTP-aware error classes that replace NestJS built-in exceptions.
 * The global Express error handler in server.ts reads `statusCode` to set the response status.
 */

export class HttpException extends Error {
  constructor(public readonly message: string, public readonly statusCode: number) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundException extends HttpException {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

export class BadRequestException extends HttpException {
  constructor(message = 'Bad request') {
    super(message, 400);
  }
}

export class ConflictException extends HttpException {
  constructor(message = 'Conflict') {
    super(message, 409);
  }
}

export class ForbiddenException extends HttpException {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}
