import { ValiError } from 'valibot';
import { NotFoundError } from './exceptions';

export function resolveErrorResponse(error: Error): { statusCode: number; body: string; description: string } {
    let statusCode = 500;
    let description = 'Internal Server Error';
    let message = error.message || description;

    if (error instanceof ValiError) {
        statusCode = 400;
        description = 'Bad Request';
        message = error.message || description;
    } else if (error instanceof NotFoundError) {
        statusCode = 404;
        description = 'Not Found';
        message = error.message || description;
    }

    return {
        statusCode: statusCode,
        description: description,
        body: JSON.stringify({
            message: message,
            type: description,
        }),
    };
}
