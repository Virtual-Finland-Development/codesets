import { Output, any, array, object, optional, record, string } from 'valibot';
import InternalResource from '../../utils/data/models/InternalResource';
import { filterCommonEscoDataSet } from '../../utils/esco';
import { isEnabledFilter, isEnabledFormat } from '../../utils/filters';

const OccupationSchema = object({
    uri: string(),
    prefLabel: record(string(), string()),
    notation: optional(string()),
    narrower: optional(any()),// optional(recursive(() => )), // Enabled by the "tree" formats parameter
    broader: optional(array(string())), // Disabled by the "tree" formats parameter
});
const OccupationsResponseSchema = array(OccupationSchema);

type Occupation = Output<typeof OccupationSchema>;
type OccupationsResponse = Output<typeof OccupationsResponseSchema>;

export default new InternalResource({
    name: 'Occupations',
    uri: 'occupations.json',
    parsers: {
        async transform(occupations: OccupationsResponse, params: Record<string, string>) {
            if (isEnabledFilter(params, 'isco') && !isEnabledFilter(params, 'esco')) {
                occupations = occupations.filter((occupation: Occupation) => {
                    return !occupation.uri.startsWith('http://data.europa.eu/esco/occupation/');
                });
            } else if (isEnabledFilter(params, 'esco')) {
                occupations = occupations.filter((occupation: Occupation) => {
                    return occupation.uri.startsWith('http://data.europa.eu/esco/occupation/');
                });
            }

            occupations = filterCommonEscoDataSet<Occupation>(occupations, params);

            if (!isEnabledFormat(params, 'broader') && !isEnabledFormat(params, 'tree')) {
                occupations = occupations.map((occupation: Occupation) => {
                    return {
                        ...occupation,
                        broader: undefined,
                    };
                });
            }

            return occupations;
        },
        output: OccupationsResponseSchema,
    }
});
