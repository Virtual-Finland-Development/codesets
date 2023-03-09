const { iso_639_1, iso_639_2 } = require("iso-639");

export default Object.values(iso_639_1).map((language: any) => {
    return {
        id: language["639-2"],
        displayName: language.name,
        englishName: iso_639_2[language["639-2"]]?.en[0] || language.name,
        nativeName: language.nativeName,
        twoLetterISOLanguageName: language["639-1"],
        threeLetterISOLanguageName: language["639-2"],
    };   
});
