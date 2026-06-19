import { ArgumentMetadata, PipeTransform, UnprocessableEntityException } from '@nestjs/common';
import { ZodError, ZodSchema } from 'zod';

/** A single field-level validation error (Req 15.6). */
export interface FieldError {
  field: string;
  constraint: string;
}

/**
 * Validates controller inputs against a Zod schema before processing (Req 15.2).
 * On failure throws 422 with an array of field-level errors (Req 15.6).
 * Usage: `@UsePipes(new ZodValidationPipe(mySchema))`.
 */
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    const result = this.schema.safeParse(value);
    if (result.success) {
      return result.data;
    }
    throw new UnprocessableEntityException({
      message: 'Validation failed',
      errors: this.formatErrors(result.error),
    });
  }

  private formatErrors(error: ZodError): FieldError[] {
    return error.errors.map((issue) => ({
      field: issue.path.join('.'),
      constraint: issue.message,
    }));
  }
}
