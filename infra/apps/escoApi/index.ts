import * as pulumi from '@pulumi/pulumi';

import { getSetup } from '../../utils/Setup';
import { createEscoApiLambdaFunctionUrl } from './resources/LambdaFunctionUrl';
const setup = getSetup();

const codesetsStackReference = new pulumi.StackReference(`${setup.organizationName}/codesets/${setup.stage}`);
const url = codesetsStackReference.getOutput('url');

// Esco API
const escoApi = createEscoApiLambdaFunctionUrl(setup, pulumi.interpolate`${url}`);
export const escoApiUrl = escoApi.lambdaFunctionUrl.functionUrl;
export const escoApiLambdaId = escoApi.lambdaFunction.id;