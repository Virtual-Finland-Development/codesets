import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

const codesetsConfig = new pulumi.Config('codesets');
const codesetsRegion = codesetsConfig.require('region') as pulumi.Input<aws.Region> | undefined;
const region = new aws.Provider('codesets-region', { region: codesetsRegion });

const setup = {
    stage: pulumi.getStack(),
    projectName: pulumi.getProject(),
    organizationName: pulumi.getOrganization(),
    getResourceConfig(name: string) {
        return {
            name: this.getResourceName(name),
            tags: {
                'vfd:stack': this.stage,
                'vfd:project': this.projectName,
            },
        };
    },
    getResourceName(name: string) {
        return `${this.projectName}-${name}-${this.stage}`;
    },
    isProductionLikeEnvironment() {
        return this.stage.endsWith('production') || this.stage.endsWith('staging');
    },
    region,
};

type ISetup = typeof setup;
function getSetup() {
    return setup;
}

export { ISetup, getSetup };
