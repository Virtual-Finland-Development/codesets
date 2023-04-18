import InternalResource from '../../utils/data/models/InternalResource';
import { getOutput } from '../../utils/data/parsers';
import { getPaginationParams } from '../../utils/filters';

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
        async transform(occupations: any, params: Record<string, string>) {
            const totalCount = occupations.length;
            const pagination = getPaginationParams(params);
            if (pagination.isPaginated) {
                occupations = occupations.slice(pagination.offset, pagination.offset + pagination.limit);
            }

            return {
                totalCount: totalCount,
                occupations: occupations,
            };
        },
        output(data: any) {
            return getOutput()<OccupationsResponse>(data);
        },
    },
});
