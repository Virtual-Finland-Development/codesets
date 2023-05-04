import * as pulumi from '@pulumi/pulumi';

const setup = {
    stage: pulumi.getStack(),
    projectName: pulumi.getProject(),
    organizationName: pulumi.getOrganization(),
    getResourceConfig(name: string) {
        return {
            name: `${this.projectName}-${name}-${this.stage}`,
            tags: {
                'vfd:stack': this.stage,
                'vfd:project': this.projectName,
            },
        };
    },
};

type ISetup = typeof setup;
function getSetup() {
    return setup;
}

export { getSetup, ISetup };
