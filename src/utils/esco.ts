import { getLocalesFilter, getSearchPhrases } from './filters';

export interface EscoDataUnit {
    uri: string;
    prefLabel: {
        [key: string]: string;
    };
    notation?: string;
    broader?: string[];
}

export function filterCommonEscoDataSet<T extends EscoDataUnit>(items: T[], params: Record<string, string>) {
    const localesFilter = getLocalesFilter(params);
    if (localesFilter.length > 0) {
        items = items.map((item: T) => {
            const filteredPrefLabel = Object.entries(item.prefLabel).reduce((acc, [key, value]) => {
                if (localesFilter.includes(key)) {
                    acc[key] = value;
                }
                return acc;
            }, {} as any);
            return {
                ...item,
                prefLabel: filteredPrefLabel,
            };
        });
    }

    const searchPhrases = getSearchPhrases(params);
    if (searchPhrases.length > 0) {
        return items.filter((item: T) => {
            const descriptions = Object.values(item.prefLabel).map((text) => {
                return text.toLocaleLowerCase();
            });
            return searchPhrases.some((phrase: string) => {
                return descriptions.some((description: string) => {
                    return description.includes(phrase);
                });
            });
        });
    }

    return items;
}
