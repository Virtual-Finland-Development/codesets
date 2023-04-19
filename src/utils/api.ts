const UriRedirects: Record<string, string> = {
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
    return {
        statusCode: 500,
        description: 'Internal Server Error',
        body: error.message || 'Internal Server Error',
    };
}
