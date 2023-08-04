import { Output, any, array, length, object, optional, record, string } from 'valibot';
import InternalResource from '../../utils/data/models/InternalResource';
import { filterCommonEscoDataSet } from '../../utils/esco';
import { isEnabledFilter, isEnabledFormat } from '../../utils/filters';

const OccupationSchema = object({
    uri: string(),
    prefLabel: record(string([length(2)]), string()), 
    notation: optional(string()),
    narrower: optional(any()), // Enabled by the "tree" formats parameter // @TODO: fix any() as OccupationSchema
    broader: optional(array(string())), // Disabled by the "tree" formats parameter
});
type Occupation = Output<typeof OccupationSchema>;

const OccupationsResponseSchema = array(OccupationSchema);
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
