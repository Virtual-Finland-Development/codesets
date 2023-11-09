import { BaseSchema, Output, array, length, merge, object, optional, record, recursive, string } from 'valibot';
import ExternalResource from '../../utils/data/models/ExternalResource';
import { filterCommonEscoDataSet } from '../../utils/esco';
import { isEnabledFilter, isEnabledFormat } from '../../utils/filters';
import { getEscoAPIEndpoint } from '../../utils/runtime';

// Build a recursive object type with children of self-likes
// @see: https://github.com/fabian-hiller/valibot/issues/72
const BaseOccupationSchema = object({
    uri: string(),
    prefLabel: record(string([length(2)]), string()),
    notation: optional(string()),
    broader: optional(array(string())), // Disabled by the "tree" formats parameter
});

type Occupation = Output<typeof BaseOccupationSchema> & {
    narrower?: Occupation[];
};

const OccupationSchema: BaseSchema<Occupation> = merge([
    BaseOccupationSchema,
    object({
        narrower: optional(recursive(() => array(OccupationSchema))), // Enabled by the "tree" formats parameter
    }),
]);

const OccupationsResponseSchema = array(OccupationSchema);
type OccupationsResponse = Output<typeof OccupationsResponseSchema>;

export default new ExternalResource({
    name: 'Occupations',
    uri: `${getEscoAPIEndpoint()}/occupations`,
    parsers: {
        async transform(occupations: OccupationsResponse, params?: Record<string, string>) {
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
    },
});
