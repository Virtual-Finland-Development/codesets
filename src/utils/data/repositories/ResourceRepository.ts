import * as resources from '../../../resources/index';
import { IResource } from '../models/shared/BaseResource';
const _resourses = resources.default;

export function getResource(resourceName: string): IResource {
    return (_resourses as any)[resourceName];
}

export function listResources() {
    return Object.keys(_resourses);
}
