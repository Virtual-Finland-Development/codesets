import InternalResource from '../../utils/data/models/InternalResource';
import { getOutput } from '../../utils/data/parsers';
import { transformOccupations as transform } from '../../utils/data/transformers';

import BusinessFinlandDataSet from './business-finland-esco-v1_1_1-occupations.json';

interface Occupation {
    escoCode: string;
    escoJobTitle: string;
    alternativeTitles: string[];
    escoDescription: string;
    escoIdentifier: string;
}

interface OccupationsResponse {
    totalCount: number;
    occupations: Occupation[];
}

export default new InternalResource({
    name: 'BusinessFinlandEscoOccupations',
    uri: 'business-finland-esco-v1_1_1-occupations.json',
    parsers: {
        transform,
        output(data: any) {
            return getOutput()<OccupationsResponse>(data);
        },
    },
    dataGetter() {
        return Promise.resolve({
            data: JSON.stringify(BusinessFinlandDataSet),
            mime: 'application/json',
        });
    },
});
