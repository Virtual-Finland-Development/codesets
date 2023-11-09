import { array, number, object, string } from 'valibot';
import ExternalResource from '../../utils/data/models/ExternalResource';
import { transformOccupations as transform } from '../../utils/data/transformers';
import { getEnvironment } from '../../utils/runtime';

const OccupationSchema = object({
    escoCode: string(),
    escoJobTitle: string(),
    alternativeTitles: array(string()),
    escoDescription: string(),
    escoIdentifier: string(),
});
export const OccupationsResponseSchema = object({
    totalCount: number(),
    occupations: array(OccupationSchema),
});

export default new ExternalResource({
    name: 'BusinessFinlandEscoOccupations',
    uri: `${getEnvironment().escoApi.endpoint}/Employment/EscoOccupations_v1.0`,
    parsers: {
        transform,
        output: OccupationsResponseSchema,
    },
});
