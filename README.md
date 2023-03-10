# codesets

A shared codesets / resources router for Virtual Finland projects

## Requirements

### Docker requirements

If using docker compose, the following network must be created: `vfd-network`.

Create the network with command:

```
docker network create vfd-network
```

## Usage

Start up the service with docker compose:

```
docker compose up
```

Natively with nodejs:

```
npm install && npm run start
```

View the available codeset resources at [http://localhost:3166](http://localhost:3166)

## Adding a codeset resource

Codesets are defined in [src/resources/internal](./src/resources/internal) and [src/resources/extrenal](./src/resources/external) folders:

-   interal: raw resource files that are served directly from the codeset services backend (S3-bucket / cloudfront)
-   external: resources that are resolved programmatically from external sources (e.g. github), cached and then served from the codeset services backend
    -   external resources are defined as [Resource](./src/utils/data/models/Resource.ts) or [ZipResource](./src/utils/data/models/ZipResource.ts) class which at minimum requires an `uri` and `name` property. The `uri` is used to resolve the resource and the `name` is used to identify the resource in the codeset service.
-   library: resources that are built to the codeset service as a library: nodejs module with default export

### External resource data parsing and transformation

The external resource parsers can be defined using the `parsers` attribute of the inherited [BaseResource](./src/utils/data/models/internal/BaseResource.ts) constructor call. The parsers are defined as follows:

```typescript
{
    ...,
    parsers: {
        input?: (data: string) => unknown; // Raw data intake -> data
        transform?: (data: unknown) => Promise<unknown>; // Data intake -> transformed data
        output?: (data: unknown) => string; // Transformed data intake -> raw output data
    }
}

```

By default for the JSON-type resource the `input` and `output` parsers are defined as follows:

```typescript
parsers: {
    input: (data: string) => JSON.parse(data),
    output: (data: unknown) => JSON.stringify(data)
}
```

#### I/O and validation helpers

For the external resource data validation there is helper functions for the input/ouput parsers:

```typescript
// resources/external/Test.ts
import { getInput, getOutput } from '../../utils/data/parsers';

interface MyDataInputInterface {
    tunniste: string;
    nimi: string;
}

interface MyDataOutputInterface {
    id: string;
    name: string;
}

...
    ...
    parsers: {
        input(responseItem: string) {
            return getInput()<MyDataInputInterface>(responseItem); // Parse/validate JSON string as object
        },
        transform(data: any) { // at this point the data should be of type MyDataInputInterface (if the input parser defined), but typescript doesn't know that
            return {
                id: data.tunniste,
                name: data.nimi,
            };
        },
        output(data: any): MyDataOutputInterface { // at this point the data-param should be of type MyDataOutputInterface, but typescript doesn't know
            return getOutput()<MyDataOutputInterface>(data); // Parse/validate output model and stringify
        },
    }
```

Working example: [src/resources/external/ISO3166CountriesURL.ts](./src/resources/external/ISO3166CountriesURL.ts)

# References

## Input/Output data validation tools

-   [typia](https://github.com/samchon/typia)

## Deployment

-   [lambda-at-edge-example](https://github.com/simonschoof/lambda-at-edge-example)
