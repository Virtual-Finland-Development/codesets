# codesets
A shared codesets / resources router for virtual finland projects

## Requirements

### Docker requirements

If using docker compose, the following network must be created: `vfd-network`.

Create the network with the following command:

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

- interal: raw resource files that are served directly from the codeset services backend (S3-bucket / cloudfront)
- external: resources that are resolved programmatically from external sources (e.g. github), cached and then served from the codeset services backend
    - external resources are defined as [Resource](./src/utils/data/Resource.ts) or [ZipResource](./src/utils/data/ZipResource.ts) class which at minimum requires an `uri` and `name` property. The `uri` is used to resolve the resource and the `name` is used to identify the resource in the codeset service.

# References

## Deployment

- [lambda-at-edge-example](https://github.com/simonschoof/lambda-at-edge-example)