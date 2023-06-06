import { ValidationError } from './exceptions';

export const UriRedirects: Record<string, string> = {
    '/productizer/draft/Employment/EscoOccupations': '/resources/BusinessFinlandEscoOccupations',
};

export function resolveUri(uri: string): string {
    return UriRedirects[uri] || uri;
}

export function resolveError(error: Error): { statusCode: number; body: string; description: string } {
    const errorPackage = resolveErrorPackage(error);
    console.error('Error: ', errorPackage);
    return errorPackage;
}

function resolveErrorPackage(error: Error): { statusCode: number; body: string; description: string } {
    if (error instanceof ValidationError) {
        return {
            statusCode: 400,
            description: 'Bad Request',
            body: error.message || 'Bad Request',
        };
    }

    return {
        statusCode: 500,
        description: 'Internal Server Error',
        body: error.message || 'Internal Server Error',
    };
}
