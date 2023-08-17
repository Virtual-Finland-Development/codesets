import { getPaginationParams } from '../filters';

/**
 * Separate occupations transformer from the resource to avoid resource-related dependencies import where not needed
 *
 * @param occupations
 * @param params
 * @returns
 */
export async function transformOccupations(occupations: any, params?: Record<string, string>) {
    const totalCount = occupations.length;
    const pagination = getPaginationParams(params);
    if (pagination.isPaginated) {
        occupations = occupations.slice(pagination.offset, pagination.offset + pagination.limit);
    }

    return {
        totalCount: totalCount,
        occupations: occupations,
    };
}
