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

Codesets are defined in [src/resources/internal](./src/resources/internal), [src/resources/library](./src/resources/library) and [src/resources/extrenal](./src/resources/external) folders:

-   interal: raw resource files that are served directly from the codeset services backend (S3-bucket / cloudfront)
-   library: resources that are built to the codeset service as a library: nodejs module with default export
-   external: resources that are resolved programmatically from external sources (e.g. github), cached and then served from the codeset services backend
    -   external resources are defined as [Resource](./src/utils/data/models/Resource.ts) or [ZipResource](./src/utils/data/models/ZipResource.ts) class which at minimum requires an `uri` and `name` property. The `uri` is used to resolve the resource and the `name` is used to identify the resource in the codeset service.

### External resource data parsing and transformation

The external resource parsers can be defined using the `parsers` attribute of the inherited [BaseResource](./src/utils/data/models/internal/BaseResource.ts) constructor call. The parsers are defined as follows:

```typescript
{
    ...,
    parsers: {
        rawInput?: (data: string) => unknown; // Raw input string -> data (e.g. JSON.parse)
        input?: BaseSchema || (data: unknown) => unknown; // data intake -> parsed data schema
        transform?: (data: unknown, params?: Record<string, string>) => Promise<unknown>; // Parsed data intake with query params obj -> transformed data
        output?: BaseSchema || (data: unknown) => unknown; // Transformed data intake -> output data schema
        rawOutput?: (data: unknown) => string; // Output data intake -> raw output string (e.g. JSON.stringify)
    }
}

```

Where `BaseSchema` is a [valibot](https://valibot.dev) schema object.

## Filter parameters

Some of the codeset resources support filtering the data with query parameters. Supported filter parameters types are:

-   `filters` - comma separated list of static filter names
-   `query` - comma separated text search query
-   `locales` - comma separated list of locales

Example query:

```
GET /resources/Skills?query=foo&locales=fi
```

Example response:

```json
[
    {
        "uri": "http://data.europa.eu/esco/skill/f6d294f4-db62-4fc5-a7b8-778e5071c112",
        "prefLabel": { "fi": "moderoida keskustelufoorumia" }
    }
]
```

# References

## Input/Output data validation tools

-   [valibot](https://valibot.dev) - data schema parser library

## Deployment

-   [lambda-at-edge-example](https://github.com/simonschoof/lambda-at-edge-example)
