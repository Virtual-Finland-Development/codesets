import InternalResource from '../../utils/data/models/InternalResource';
import { getOutput } from '../../utils/data/parsers';
import { filterCommonEscoDataSet } from '../../utils/esco';

interface Occupation {
    uri: string;
    notation: string;
    prefLabel: {
        [key: string]: string;
    };
    broader: string[];
}

export default new InternalResource({
    name: 'Occupations',
    uri: 'occupations.json',
    parsers: {
        async transform(occupations: any, params: Record<string, string>) {
            return filterCommonEscoDataSet(occupations, params);
        },
        output(data: any) {
            return getOutput()<Occupation[]>(data);
        },
    },
});
