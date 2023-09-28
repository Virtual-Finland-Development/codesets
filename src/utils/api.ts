import { ValiError } from 'valibot';
import { NotFoundError } from './exceptions';

export const UriRedirects: Record<string, string> = {
    '/Employment/EscoOccupations_v1.0': '/resources/BusinessFinlandEscoOccupations',
    '/Employment/EscoOccupations_v0.1': '/resources/BusinessFinlandEscoOccupations',
};

export function resolveUri(uri: string): string {
    return UriRedirects[uri] || uri;
}

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
