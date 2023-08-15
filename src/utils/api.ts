import { ValiError } from "valibot";

export const UriRedirects: Record<string, string> = {
    '/productizer/draft/Employment/EscoOccupations': '/resources/BusinessFinlandEscoOccupations',
};

export function resolveUri(uri: string): string {
    return UriRedirects[uri] || uri;
}

export function resolveErrorResponse(error: Error): { statusCode: number; body: string; description: string } {
    if (error instanceof ValiError) {
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
