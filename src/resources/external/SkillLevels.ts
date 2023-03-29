import SuomiFiKoodistotResource from '../../utils/data/models/SuomiFiKoodistotResource';

export default new SuomiFiKoodistotResource({
    name: 'SkillLevels',
    uri: 'https://koodistot.suomi.fi/codelist-api/api/v1/coderegistries/dataecon/codeschemes/skilllevel/?format=json&embedCodes=true&embedExtensions=true&embedMembers=true&expand=extension,member,codeScheme,code,memberValue,codeRegistry,organization,valueType,externalReference,propertyType&downloadFile=false&pretty',
});
