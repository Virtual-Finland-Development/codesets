import { Mixin } from 'ts-mixer';
import ExternalResource from './ExternalResource';
import ZipResource from './ZipResource';

export default class ExternalZipResource extends Mixin(ExternalResource, ZipResource) {}