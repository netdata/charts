# Netdata frontend SDK and chart utilities

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
  $ yarn storybook
```

## Build

There are 3 different distributions. The following command creates the different distributions in the `./dist` folder

```shell
  $ yarn build
```

Build the distributions isolated

**UMD** produces a single file `./dist/sdk.min.js` what contains the entire bundle

```shell
  $ yarn build:umd
```

**ES6** Builds the files using ES Modules in `./dist/es6/*` folder

```shell
  $ yarn build:es6
```

**cjs** Builds the files using CommonJS in `./dist/*` folder

```shell
  $ yarn build:cjs
```

## Testing

```shell
  $ yarn test
```

## Lint

```shell
  $ yarn lint
```
