# Netdata frontend SDK and chart utilities

## Storybook

https://netdata.github.io/charts

## Install

npm:

```shell
  $ npm install @netdata/charts
```

yarn:

```shell
  $ yarn add @netdata/charts
```

## Develop

```shell
  $ yarn start
```

## Build

The package builds CommonJS and ES6 distributions into `./dist`.

```shell
  $ yarn build
```

Build either distribution independently:

**ES6** builds files using ES Modules in `./dist/es6/*`.

```shell
  $ yarn build:es6
```

**CommonJS** builds files using CommonJS in `./dist/*`.

```shell
  $ yarn build:cjs
```

## GPU renderer development

The accelerated renderer architecture, ownership rules, extension contract, fallback behavior, diagnostics, and validation requirements are documented in [`docs/gpu-renderers.md`](docs/gpu-renderers.md).

The deterministic browser harness is documented in [`benchmarks/time-series-renderers/README.md`](benchmarks/time-series-renderers/README.md).

## Testing

```shell
  $ yarn test
```

## Lint

```shell
  $ yarn lint
```
