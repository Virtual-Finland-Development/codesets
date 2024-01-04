import { Output, array, length, object, string } from 'valibot';
import ExternalResource from '../../utils/data/models/ExternalResource';
import { isEnabledFilter } from '../../utils/filters';
import { testbedCountryCodes } from '../../utils/data/testbed-country-codes';

const CountriesInputDataSchema = array(
    object({
        cca2: string([length(2)]),
        cca3: string([length(3)]),
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
    twoLetterISORegionName: string([length(2)]),
    threeLetterISORegionName: string([length(3)]),
});
type Country = Output<typeof CountrySchema>;
const CountriesResponseSchema = array(CountrySchema);

export default new ExternalResource({
    name: 'ISO3166CountriesURL',
    uri: 'https://github.com/mledoze/countries/blob/master/countries.json?raw=true',
    mime: 'application/json; charset=utf-8',
    parsers: {
        input: CountriesInputDataSchema,
        async transform(countriesRaw: CountriesInputData, params?: Record<string, string>) {
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
                return countries.filter((country: Country) =>
                    testbedCountryCodes.includes(country.threeLetterISORegionName)
                );
            }
            return countries;
        },
        output: CountriesResponseSchema,
    },
});
