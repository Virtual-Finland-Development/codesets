export function isEnabledFilter(params: Record<string, string>, filterName: string): boolean {
    if (typeof params.filters === 'string') {
        const filters = params.filters.split(',');
        return filters.includes(filterName);
    }
    return false;
}

export function isEnabledFormat(params: Record<string, string>, formatName: string): boolean {
    if (typeof params.formats === 'string') {
        const formats = params.formats.split(',');
        return formats.includes(formatName);
    }
    return false;
}

export function getSearchPhrases(params: Record<string, string>): Array<string> {
    if (typeof params.query === 'string') {
        return params.query.toLocaleLowerCase().split(',');
    }
    return [];
}

export function getLocalesFilter(params: Record<string, string>): Array<string> {
    if (typeof params.locales === 'string') {
        return params.locales.toLocaleLowerCase().split(',');
    }
    return [];
}

export function getPaginationParams(params: Record<string, string>): {
    isPaginated: boolean;
    offset: number;
    limit: number;
} {
    let offset = -1;
    let limit = -1;

    if (typeof params.offset !== 'undefined' && typeof params.limit !== 'undefined') {
        offset = parseInt(params.offset);
        limit = parseInt(params.limit);
        if (!Number.isInteger(offset) || !Number.isInteger(limit)) {
            throw new Error('Invalid pagination parameters');
        }
    }

    return {
        isPaginated: offset >= 0 && limit > 0,
        offset,
        limit,
    };
}
