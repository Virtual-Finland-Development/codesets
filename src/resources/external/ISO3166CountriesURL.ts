import typia from "typia";
import ExternalResource from "../../utils/data/Resource";

type Country = {
    id: string;
    displayName: string;
    englishName: string;
    nativeName: string;
    twoLetterISORegionName: string;
    threeLetterISORegionName: string;
};

export default new ExternalResource({ 
    name: "ISO3166CountriesURL",
    uri: "https://github.com/mledoze/countries/blob/master/countries.json?raw=true",
    mime: "application/json; charset=utf-8",
    async transformer(data: string) {
        
        const countriesRaw = JSON.parse(data);
        const countries = countriesRaw.map((countryData: any) => {
            return {
                "id": countryData.cca2,
                "displayName": countryData.name.common,
                "englishName": countryData.name.official,
                "nativeName": "",
                "twoLetterISORegionName": countryData.cca2,
                "threeLetterISORegionName": countryData.cca3
            };
        });

        return typia.assertStringify<Country[]>(countries);
    },
});