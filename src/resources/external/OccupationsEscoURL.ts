import { any, array, object, optional, record, string } from 'valibot';
import Resource from '../../utils/data/models/Resource';

const IscoOutputSchema = array(object({
    uri: string(),
    status: string(),
    notation: string(),
    prefLabel: record(string(), string()),
    altLabel: record(string(), array(string())),
    broader: optional(array(string())),
    narrower: optional(array(any())), // 
}));

export default new Resource({
    name: 'OccupationsEscoURL',
    uri: 'https://tyomarkkinatori.fi/api/codes/v1/isco',
    parsers: {
        output: IscoOutputSchema,
    },
});
