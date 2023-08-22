const { iso_639_1, iso_639_2 } = require('iso-639');

// ISO codes not defined in JobApplicantProfile definition
// https://github.com/Virtual-Finland/definitions/blob/main/DataProducts/draft/Person/JobApplicantProfile/Write.json#L3880C10-L3880C10
const EXCLUDE_LANG_CODES = ['bh', 'zu'];

export default Object.values(iso_639_1)
    .filter((language: any) => !EXCLUDE_LANG_CODES.includes(language['639-1']))
    .map((language: any) => {
        return {
            id: language['639-2'],
            displayName: language.name,
            englishName: iso_639_2[language['639-2']]?.en[0] || language.name,
            nativeName: language.nativeName,
            twoLetterISOLanguageName: language['639-1'],
            threeLetterISOLanguageName: language['639-2'],
        };
    });
