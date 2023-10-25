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
const edgeRegionProvider = new aws.Provider(`region-${edgeRegion}`, {
    region: edgeRegion as pulumi.Input<aws.Region> | undefined,
});

const resourcesRegion = new pulumi.Config('aws').require('region');
const resourcesRegionProvider = new aws.Provider(`region-${resourcesRegion}`, {
    region: resourcesRegion as pulumi.Input<aws.Region> | undefined,
});

async function getAllRegions() {
    const edgeRegions = await aws.getRegions({});

    const regions = [
        {
            name: resourcesRegion,
            provider: resourcesRegionProvider,
        },
        {
            name: edgeRegion,
            provider: edgeRegionProvider,
        },
    ];

    for (const region of edgeRegions.names) {
        if (region === resourcesRegion || region === edgeRegion) {
            continue;
        }

        regions.push({
            name: region,
            provider: new aws.Provider(getResourceName(`region-${region}`), {
                region: region as pulumi.Input<aws.Region> | undefined,
            }),
        });
    }
    return regions;
}

const errorSubLambdaArn = new pulumi.StackReference(`${organizationName}/cloudwatch-logs-alerts/${stage}`).getOutput(
    'errorSubLambdaFunctionArn'
);

const setup = {
    stage,
    projectName,
    organizationName,
    getResourceConfig,
    getResourceName,
    isProductionLikeEnvironment,
    errorSubLambdaArn,
    regions: {
        getAllRegions: getAllRegions,
        edgeRegion: {
            name: edgeRegion,
            provider: edgeRegionProvider,
        },
        resourcesRegion: {
            name: resourcesRegion,
            provider: resourcesRegionProvider,
        },
    },
};

type ISetup = typeof setup;
function getSetup() {
    return setup;
}

export { ISetup, getSetup };
