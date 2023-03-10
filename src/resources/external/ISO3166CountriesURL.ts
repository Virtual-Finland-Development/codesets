import Resource from '../../utils/data/models/Resource';

interface Country {
    id: string;
    displayName: string;
    englishName: string;
    nativeName: string;
    twoLetterISORegionName: string;
    threeLetterISORegionName: string;
}

export default new Resource<Country>({
    name: 'ISO3166CountriesURL',
    uri: 'https://github.com/mledoze/countries/blob/master/countries.json?raw=true',
    mime: 'application/json; charset=utf-8',
    async transformer(countriesRaw: any) {
        return countriesRaw.map((countryData: any) => {
            return {
                id: countryData.cca2,
                displayName: countryData.name.common,
                englishName: countryData.name.official,
                nativeName: '',
                twoLetterISORegionName: countryData.cca2,
                threeLetterISORegionName: countryData.cca3,
            };
        });
    },
});
