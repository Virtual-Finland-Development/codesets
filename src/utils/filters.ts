export function isEnabledFilter(params: Record<string, string>, filterName: string): boolean {
    if (typeof params.filters === 'string') {
        const filters = params.filters.split(',');
        return filters.includes(filterName);
    }
    return false;
}
