# ASU SHARES FHIR Consent CDS Hooks Services

The ASU SHARES FHIR Consent Service from [ASU SHARES](https://www.asushares.com) is a reference implementation providing FHIR-based healthcare data sharing determination decisions and content data redaction functions based on FHIR R5 and CDS Hooks v1 and v2. Long term, we intend to settle on FHIR R6 once the specification stabilizes.

FHIR Consent Service is part of a U.S. National Institute of Health (NIH) project funded through August, 2028. Technical execution of the Arizona State University (ASU) "Substance use HeAlth REcord Sharing" (SHARES) grant is led by co-investigator Dr. Preston Lee at Arizona State University under principal investigator Dr. Adela Grando. See the [ASU SHARES Team](https://www.asushares.com/team) for a full list of stakeholders.

At a high level, FHIR Consent Service:

 - Loads a configurable set of content sensitivity rules and metadata. 
 - Accepts REST invokations (based on the CDS Hooks request/response protocol) of a data sharing consent contexnt and optional FHIR bundle.
 - Queries a FHIR backend server for Consent documents and determines which, if any, are applicable to the CDS invokation context.
 - Informs the client (via FHIR ActCodes) on the nature of content sensitivity rules found to be pertinent to the request.
 - Redact the optionally-provided FHIR bundle, when provided, based on all available sensitivity rule and applicable Consent information.

# Roadmap

| Version   | Expected Features                     |
| ----      | ----                                  |
| < 1 (Current)       | Initial alpha development of completely new TypeScript-based, stateless implementation of "patient-consent-consult" CDS Hook service as a reusable, containerized microservice. |
| 1          | FHIR R5 and CDS Hooks v1/v2 compliance implementation with minimum necessary features applicable for [ASU SHARES](https://www.asushares.com) use cases and baseline performance measurements.|
| 2          | Modular processing framework with new weighted classifier implementation.
| 3+        | Context-based classification and additional advance implementation modules.

# Running SHARES Consent Service with Docker/Podman/Kubernetes

## Step 1: Run the CDS Service and FHIR backend

### Option 1: Use your own R5 server
If you have your own FHIR R5 server, either set the following environment variables or create a `.env` file with KEY=value definitions for the following:

```bash
FHIR_BASE_URL=https://your_fhir_server_url
ORG_NAME=ASUSHARES
ORG_URL=https://www.your_company_website.com
```

Then run the latest SHARES Consent Service build:

```shell
$ docker run -it --rm -p 3000:3000 asushares/cds:latest
```

To load sample FHIR bundles into your FHIR R5 backend
```shell
find src/samples -name '*.json' -exec curl -X POST -H 'Content-Type: application/fhir+json' http://localhost:8080/fhir -d @{} \;
```
### Option 2: Use our example HAPI server

If you do not have a server, you may use the  must have a backend FHIR server, such as HAPI FHIR, available as well.  

## Step 2: Load Seed Data

TODO document!

## Step 3: Build Your Consent Documents

Consent documents in FHIR R5 are very different than in R4 and prior releases. They are generally more flexible -- e.g. they do not only apply to patients -- and the logical representation requires different considerations than prior implementations.

We have also developed a UI for provider browsing and management of R5 Consent documents called [Consent Manager](https://github.com/asushares/consent-manager) that aims to fully support modeling of R5 Consent documents. See the project page for usage.

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


## Building

```shell
$ docker build -t asushares/cds:latest . # Local CPU architecture only
$ docker buildx build --platform linux/arm64/v8,linux/amd64 -t asushares/cds:latest . --push # Multi-architecture
```

# Examples

TODO Write comprehensive examples of running each major use case.
```bash

curl -H 'Accept: application/json' -H 'Content-Type: application/json' http://localhost:3000

curl -H 'Accept: application/json' -H 'Content-Type: application/json' http://localhost:3000/cds-services

curl -X POST -H 'Accept: application/json' -H 'Content-Type: application/json' -d "@`pwd`/test/example-request-permit.json" http://localhost:3000/cds-services/patient-consent-consult

curl -X POST -H 'Accept: application/json' -H 'Content-Type: application/json' -d "@`pwd`/test/example-request-no-consent-found.json" http://localhost:3000/cds-services/patient-consent-consult

curl -X POST -H 'Accept: application/json' -H 'Content-Type: application/json' -d "@`pwd`/test/example-request-deny.json" http://localhost:3000/cds-services/patient-consent-consult
```

# Overriding Execution Behavior with HTTP Headers

## CDS-Confidence-Threshold: <number> (default: 0.0)

The CDS-Confidence-Threshold header can be used to specific a new minimum threshold value used to determin what constitutes an applicable sensitivity rule. Rules may use any arbitrary confidence values, though the default rules use 0.0 <= x <= 1.0. So if you want to change this value from the default, try a value greater than 0.0 but less than 1.0. Overly high values will prevent _any_ rule from matching.

## "CDS-Redaction-Enabled": true | <any> (default: true)

By default, the engine will automatically redact any resources labeled as sensitive. You may disable this behavior if, for example, you would to see what the engine considered sensitive for a given set of inputs, but do _not_ want it to actually redact those resources.

## License

Apache 2.0

## Attribution

Preston Lee
