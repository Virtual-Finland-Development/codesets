import BaseResource from './internal/BaseResource';

export default class LibraryResource extends BaseResource {
    public type = 'library';
    _parseRawData(data: string): Promise<string> {
        return Promise.resolve(data);
    }
}
