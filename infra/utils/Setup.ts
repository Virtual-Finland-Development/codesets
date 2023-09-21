import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

const edgeRegion = new aws.Provider('edge-region', {
    region: new pulumi.Config('codesets').require('edgeRegion') as pulumi.Input<aws.Region> | undefined,
});

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
    edgeRegion,
};

type ISetup = typeof setup;
function getSetup() {
    return setup;
}

export { ISetup, getSetup };
