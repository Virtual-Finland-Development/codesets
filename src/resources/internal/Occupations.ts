import InternalResource from '../../utils/data/models/InternalResource';
import { getOutput } from '../../utils/data/parsers';
import { filterCommonEscoDataSet } from '../../utils/esco';
import { isEnabledFilter } from '../../utils/filters';

interface Occupation {
    uri: string;
    prefLabel: {
        [key: string]: string;
    };
    notation?: string;
    narrower?: Occupation[]; // Enabled by the "tree" formats parameter
}

export default new InternalResource({
    name: 'Occupations',
    uri: 'occupations.json',
    parsers: {
        async transform(occupations: any, params: Record<string, string>) {
            if (isEnabledFilter(params, 'isco') && !isEnabledFilter(params, 'esco')) {
                occupations = occupations.filter((occupation: Occupation) => {
                    return !occupation.uri.startsWith('http://data.europa.eu/esco/occupation/');
                });
            } else if (isEnabledFilter(params, 'esco')) {
                occupations = occupations.filter((occupation: Occupation) => {
                    return occupation.uri.startsWith('http://data.europa.eu/esco/occupation/');
                });
            }

            return filterCommonEscoDataSet<Occupation>(occupations, params);
        },
        output(data: any) {
            return getOutput()<Occupation[]>(data);
        },
    },
});
