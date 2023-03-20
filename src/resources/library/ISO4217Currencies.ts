import { json } from '@iso4217/json';
import LibraryResource from '../../utils/data/models/LibraryResource';
import { isEnabledFilter } from '../../utils/filters';

type Currency = {
    id: string;
    name: string;
};

// Prep currency data set
const transformed: Array<Currency> = Object.values(
    json['$data'][0]['$data'].reduce((acc: any, blob: any) => {
        const blobData = blob['$data'];
        const name = blobData.find((item: any) => item['$name'] === 'CcyNm')?.['$data'] ?? '';
        const code = blobData.find((item: any) => item['$name'] === 'Ccy')?.['$data'] ?? '';
        //const country = blobData.find((item: any) => item["$name"] === "CtryNm")?.["$data"] ?? "";

        if (typeof acc[code] === 'undefined') {
            // Pick the first one in the dataset, prevent duplicate ids
            acc[code] = {
                id: code,
                name,
            };
        }
        return acc;
    }, {} as Record<string, Currency>)
);

// Define resource filters
const filters = {
    filterNsgValues(data: Array<Currency>): Array<Currency> {
        return data.filter((currency: Currency) => ['EUR', 'SEK', 'NOK', 'ISK', 'DKK'].includes(currency.id));
    },
};

export default new LibraryResource({
    name: 'ISO4217Currencies',
    async dataGetter(params: Record<string, string>) {
        let data = transformed;

        if (isEnabledFilter(params, 'nsg')) {
            data = filters.filterNsgValues(data);
        }

        return {
            data: JSON.stringify(data),
            mime: 'application/json; charset=utf-8',
        };
    },
});
