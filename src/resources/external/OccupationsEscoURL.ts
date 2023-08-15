import { BaseSchema, Output, array, length, merge, object, optional, record, recursive, string } from 'valibot';
import ExternalResource from '../../utils/data/models/ExternalResource';

// Build a recursive object type with children of self-likes
// @see: https://github.com/fabian-hiller/valibot/issues/72
const BaseIscoItemSchema = object({
    uri: string(),
    status: string(),
    notation: string(),
    prefLabel: record(string([length(2)]), string()),
    altLabel: record(string(), array(string())),
    broader: optional(array(string())),
});

export type IscoItem = Output<typeof BaseIscoItemSchema> & {
    narrower?: IscoItem[],
};

const IscoItemSchema: BaseSchema<IscoItem> = merge([
    BaseIscoItemSchema,
    object({
        narrower: optional(recursive(() => array(IscoItemSchema)))
    })
]);

export default new ExternalResource({
    name: 'OccupationsEscoURL',
    uri: 'https://tyomarkkinatori.fi/api/codes/v1/isco',
    parsers: {
        output: array(
            IscoItemSchema
        ),
    },
});
