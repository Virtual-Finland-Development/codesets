import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export const stage = pulumi.getStack();
export const projectName = pulumi.getProject();
export const organizationName = pulumi.getOrganization();

export function getResourceConfig(name: string) {
    return {
        name: getResourceName(name),
        tags: getTags(),
    };
}

export function getResourceName(name: string) {
    return `${projectName}-${name}-${stage}`;
}

export function getTags() {
    return {
        'vfd:stack': stage,
        'vfd:project': projectName,
    };
}

export function isProductionLikeEnvironment() {
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

export const regions = {
    getAllRegions: getAllRegions,
    edgeRegion: {
        name: edgeRegion,
        provider: edgeRegionProvider,
    },
    resourcesRegion: {
        name: resourcesRegion,
        provider: resourcesRegionProvider,
    },
};
