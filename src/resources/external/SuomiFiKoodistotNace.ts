import ExternalResource from "../../utils/data/Resource";

export default new ExternalResource({ 
    name: "SuomiFiKoodistotNace",
    uri: "https://koodistot.suomi.fi/codelist-api/api/v1/coderegistries/jhs/codeschemes/toimiala_1_20080101/?format=json&embedCodes=true&embedExtensions=true&embedMembers=true&expand=extension,member,codeScheme,code,memberValue,codeRegistry,organization,valueType,externalReference,propertyType&downloadFile=false&pretty",
    async transformer(data: string) {
        const naceResponse = JSON.parse(data); // @TODO: validate response
        return JSON.stringify(naceResponse["codes"]);
    },
});