import SuomiFiKoodistotResource from '../../utils/data/models/SuomiFiKoodistotResource';

export default new SuomiFiKoodistotResource({
    name: 'WorkPermits',
    uri: 'https://koodistot.suomi.fi/codelist-api/api/v1/coderegistries/dataecon/codeschemes/permit/?format=json&embedCodes=true&embedExtensions=true&embedMembers=true&expand=extension,member,codeScheme,code,memberValue,codeRegistry,organization,valueType,externalReference,propertyType&downloadFile=false&pretty',
});
