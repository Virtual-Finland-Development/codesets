import typia from "typia";
import ZipResource from "../../utils/data/ZipResource";

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
}

export default new ZipResource({ 
    name: "OccupationsFlatURL",
    uri: "https://tyomarkkinatori.fi/dam/jcr:42efb1fc-93f3-4146-a46f-71c2f9f5eb9b/occupations.json.zip",
    mime: "application/json; charset=utf-8",
    async transformer(data: string) {
        const occupationsRaw = JSON.parse(data); 
        const occupations = occupationsRaw.filter((occupation: any) => Boolean(occupation.notation));
        return typia.assertStringify<ISCO[]>(occupations);
    }
});