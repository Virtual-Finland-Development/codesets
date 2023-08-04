import BaseResource from './internal/BaseResource';

export default class LibraryResource<I = unknown, O = unknown> extends BaseResource<I, O> {
    public type = 'library';
    _parseRawData(data: string): Promise<string> {
        return Promise.resolve(data);
    }
}
