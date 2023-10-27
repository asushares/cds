# ASU SHARES CDS Hooks Services

ASU SHARES Consent CDS Hooks services for FHIR R5. You must have a backend FHIR server, such as HAPI FHIR, available as well.  

## Running From Source

```shell
$ npm i # to install dependencies
$ npm run start # to run normally, or
$ npm run watch # to automatically restart upon code changes
```

## Testing From Source

```shell
$ npm run test # to run once, or
$ npm run test-watch # to automatically rerun tests upon code or test changes
```

## OCI/Docker/Podman Runtime

```shell
$ docker run -it --rm -p 3000:3000 -e FHIR_BASE_URL=https://your_fhir_server_host asushares/cds:latest
```

## Building

```shell
$ docker build -t asushares/cds:latest . # Local CPU architecture only
$ docker buildx build --platform linux/arm64/v8,linux/amd64 -t asushares/cds:latest . --push # Multi-architecture
```

## License

Apache 2.0

## Attribution

Preston Lee
