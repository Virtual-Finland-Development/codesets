import * as resources from '../../../resources/index';
import { IResource } from '../models/internal/BaseResource';
const _resourses = resources.default;

export function getResources(resourceType: 'external' | 'internal' | 'library' | 'all' = 'all') {
    if (resourceType === 'all') {
        return {
            ..._resourses.external,
            ..._resourses.internal,
            ..._resourses.library,
        };
    }
    return {
        ...(_resourses as any)[resourceType],
    };
}

export function getResource(resourceName: string): IResource {
    const resources = getResources();
    return (resources as any)[resourceName];
}

export function listResources() {
    const resources = getResources();
    return Object.keys(resources);
}
