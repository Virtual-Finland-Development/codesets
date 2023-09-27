import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

const stage = pulumi.getStack();
const projectName = pulumi.getProject();
const organizationName = pulumi.getOrganization();

function getResourceConfig(name: string) {
    return {
        name: getResourceName(name),
        tags: {
            'vfd:stack': stage,
            'vfd:project': projectName,
        },
    };
}

function getResourceName(name: string) {
    return `${projectName}-${name}-${stage}`;
}

function isProductionLikeEnvironment() {
    return stage.endsWith('production') || stage.endsWith('staging');
}

const edgeRegion = new pulumi.Config('codesets').require('edgeRegion');
const edgeRegionProvider = new aws.Provider('edge-region', {
    region: edgeRegion as pulumi.Input<aws.Region> | undefined,
});

const resourcesRegion = new pulumi.Config('aws').require('region');
const resourcesRegionProvider = new aws.Provider('resourses-region', {
    region: resourcesRegion as pulumi.Input<aws.Region> | undefined,
});

async function getProviders() {
    const edgeRegions = await aws.getRegions({});
    const providers = [];
    for (const region of edgeRegions.names) {
        providers.push({
            name: region,
            provider: new aws.Provider(getResourceName(`region-${region}`), {
                region: region as pulumi.Input<aws.Region> | undefined,
            }),
        });
    }
    return providers;
}

const setup = {
    stage,
    projectName,
    organizationName,
    getResourceConfig,
    getResourceName,
    isProductionLikeEnvironment,
    regions: {
        getProviders: getProviders,
        edgeRegion: {
            region: edgeRegion,
            provider: edgeRegionProvider,
        },
        resourcesRegion: {
            region: resourcesRegion,
            provider: resourcesRegionProvider,
        },
    },
};

type ISetup = typeof setup;
function getSetup() {
    return setup;
}

export { ISetup, getSetup };
