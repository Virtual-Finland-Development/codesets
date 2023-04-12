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
