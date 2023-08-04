import { array, number, object, string } from 'valibot';
import InternalResource from '../../utils/data/models/InternalResource';
import { transformOccupations as transform } from '../../utils/data/transformers';

import BusinessFinlandDataSet from './business-finland-esco-v1_1_1-occupations.json';

const OccupationSchema = object({
    escoCode: string(),
    escoJobTitle: string(),
    alternativeTitles: array(string()),
    escoDescription: string(),
    escoIdentifier: string(),
});
const OccupationsResponseSchema = object({
    totalCount: number(),
    occupations: array(OccupationSchema),
});

export default new InternalResource({
    name: 'BusinessFinlandEscoOccupations',
    uri: 'business-finland-esco-v1_1_1-occupations.json',
    parsers: {
        transform,
    },
    dataGetter() {
        return Promise.resolve({
            data: JSON.stringify(BusinessFinlandDataSet),
            mime: 'application/json',
        });
    },
    schemas: {
        output: OccupationsResponseSchema,
    },
});
