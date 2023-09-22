#!/bin/bash
# This script is used to clean up the pulumi stack of migrated s3 assets
# as of pulumi issue: https://github.com/pulumi/pulumi-aws/issues/879
# Clear the s3 assets manually from the origin region after the migration

# Navigate to the pulumi stack directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd ${SCRIPT_DIR}/..

IFS=$'\n'

STAGE_WITHOUT_ORG=$1
if [ -z "$STAGE_WITHOUT_ORG" ]
then
    echo "Please provide STAGE_WITHOUT_ORG as an argument"
    exit 1
fi

s3_resources=(
resources/BusinessFinlandEscoOccupations.ts
resources/occupations.json
index.html
resources/Skills.ts
resources/business-finland-esco-v1_1_1-occupations.json
resources/genders.json
resources/Occupations.ts
resources/skills.json
resources/nace-dot-notated.json
)

related_resources=(
urn:pulumi:${STAGE_WITHOUT_ORG}::codesets::aws:s3/bucketPolicy:BucketPolicy::codesets-S3BucketPolicy-${STAGE_WITHOUT_ORG}
urn:pulumi:${STAGE_WITHOUT_ORG}::codesets::aws:s3/bucket:Bucket::codesets-s3bucket-${STAGE_WITHOUT_ORG}
)

for resource in "${s3_resources[@]}"
do
    echo "> Deleting ${resource}.."
    pulumi state delete -y urn:pulumi:${STAGE_WITHOUT_ORG}::codesets::aws:s3/bucketObject:BucketObject::${resource}
done

for resource in "${related_resources[@]}"
do
    echo "> Deleting ${resource}.."
    pulumi state delete -y ${resource}
done