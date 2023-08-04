import { Output, array, maxLength, minLength, object, string } from 'valibot';
import Resource from '../../utils/data/models/Resource';
import { isEnabledFilter } from '../../utils/filters';

const CountriesInputDataSchema = array(
    object({
        cca2: string([minLength(2), maxLength(2)]),
        cca3: string([minLength(3), maxLength(3)]),
        name: object({
            common: string(),
            official: string(),
        }),
    })
);
type CountriesInputData = Output<typeof CountriesInputDataSchema>;

const CountrySchema = object({
    id: string(),
    displayName: string(),
    englishName: string(),
    nativeName: string(),
    twoLetterISORegionName: string([minLength(2), maxLength(2)]),
    threeLetterISORegionName: string([minLength(3), maxLength(3)]),
});
type Country = Output<typeof CountrySchema>;
const CountriesResponseSchema = array(CountrySchema);

async function fetchTestbedCountryIds(): Promise<string[]> {
    const response = await fetch(
        'https://raw.githubusercontent.com/Virtual-Finland/definitions/main/DataProducts/draft/NSG/Agent/LegalEntity/NonListedCompany/Establishment/Write.json'
    );
    const data = await response.json();
    return data.components.schemas.ISO_3166_1_Alpha_3.enum;
}

export default new Resource({
    name: 'ISO3166CountriesURL',
    uri: 'https://github.com/mledoze/countries/blob/master/countries.json?raw=true',
    mime: 'application/json; charset=utf-8',
    parsers: {
        async transform(countriesRaw: CountriesInputData, params: Record<string, string>) {
            const countries = countriesRaw.map((countryData) => {
                return {
                    id: countryData.cca2,
                    displayName: countryData.name.common,
                    englishName: countryData.name.official,
                    nativeName: '',
                    twoLetterISORegionName: countryData.cca2,
                    threeLetterISORegionName: countryData.cca3,
                };
            });

            if (isEnabledFilter(params, 'testbed')) {
                const TestbedCountryIds = await fetchTestbedCountryIds();
                return countries.filter((country: Country) =>
                    TestbedCountryIds.includes(country.threeLetterISORegionName)
                );
            }
            return countries;
        },
    },
    schemas: {
        input: CountriesInputDataSchema,
        output: CountriesResponseSchema,
    }
});
