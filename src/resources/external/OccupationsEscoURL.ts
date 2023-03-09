import typia from "typia";
import ExternalResource from "../../utils/data/Resource";

type ISCO = {
    uri: string,
    status: string,
    notation: string,
    prefLabel: {
        fi: string,
        sv: string,
        en: string
    },
    altLabel: {
        fi: string[],
        sv: string[],
        en: string[],
    },
    broader?: string[],
    narrower?: ISCO[],
}

export default new ExternalResource({
    name: "OccupationsEscoURL",
    uri: "https://tyomarkkinatori.fi/api/codes/v1/isco",
    async transformer(data: string) {
        const response = JSON.parse(data);
        return typia.assertStringify<ISCO[]>(response);
    },
});