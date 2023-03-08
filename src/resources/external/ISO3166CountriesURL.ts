import ExternalResource from "../../utils/data/Resource";

export default new ExternalResource({ 
    name: "ISO3166CountriesURL",
    uri: "https://github.com/mledoze/countries/blob/master/countries.json?raw=true",
    mime: "application/json; charset=utf-8",
    async transformer(data: string) {
        const countriesRaw = JSON.parse(data);
        const countries = countriesRaw.map((country: any) => {
            return {
                "id": country.cca2,
                "displayName": country.name.common,
                "englishName": country.name.official,
                "nativeName": "",
                "twoLetterISORegionName": country.cca2,
                "threeLetterISORegionName": country.cca3
            };
        });
        return JSON.stringify(countries);
    },
});