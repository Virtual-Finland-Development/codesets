import SuomiFiKoodistotResource from '../../utils/data/models/SuomiFiKoodistotResource';

export default new SuomiFiKoodistotResource({
    name: 'EducationFields',
    uri: 'https://koodistot.suomi.fi/codelist-api/api/v1/coderegistries/jhs/codeschemes/isced_ala_1_20110101/?format=json&embedCodes=true&embedExtensions=true&embedMembers=true&expand=extension,member,codeScheme,code,memberValue,codeRegistry,organization,valueType,externalReference,propertyType&downloadFile=false&pretty',
});
