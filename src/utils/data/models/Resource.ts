import BaseResource from './internal/BaseResource';

export default class Resource<Output = string, Input = unknown> extends BaseResource<Output, Input> {}
