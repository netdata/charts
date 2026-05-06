# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Context

**@netdata/charts** is a frontend SDK and chart utilities library for Netdata, providing React-based chart components and visualization tools. It builds multiple distributions (CommonJS, ES6, and UMD) and serves as a peer dependency alongside @netdata/netdata-ui.

## Essential Commands

```bash
# Development & Build
yarn build                    # Build both CJS and ES6 distributions
yarn build:cjs               # Build CommonJS distribution  
yarn build:es6               # Build ES6 distribution
yarn storybook               # Start Storybook development server
yarn build-storybook         # Build static Storybook

# Testing & Quality
yarn test                     # Run tests
yarn lint                     # Run ESLint

# Local Development
yarn to-cloud                # Copy built package to cloud-frontend node_modules
```

## Code Style & Conventions

### Formatting Standards
- **No semicolons** (consistent across all files)
- **Double quotes** for strings
- **2-space indentation** (no tabs)
- **100 character line width**
- **ES5 trailing commas** 
- **Arrow functions** preferred over function declarations
- **Template literals** for dynamic strings

### JavaScript Patterns
- **ES6 imports/exports** throughout
- **All imports at the top of file**: Never use require() or dynamic imports within function bodies
- **Destructuring** heavily used in function parameters
- **Props spreading** with `{...rest}` for prop forwarding
- **Conditional rendering** using `&&` and ternary operators
- **No comments** unless absolutely necessary for complex logic

### React Conventions
- **Hooks-first approach**: Prefer custom hooks over class components
- **Composition over inheritance**: Build components from smaller pieces
- **JSX in .js files**: No .jsx extension required
- **React 19 automatic JSX transform**: No React import needed in component files

## Architecture Patterns

### SDK Pattern
- Central `makeSDK` function creates chart instances
- Plugin system for extending functionality (hover, pan, select, highlight)
- Attribute-based chart configuration

### Component Architecture
- **Styled Components 6**: Primary styling solution with theme integration
- **@netdata/netdata-ui**: Base component library (Flex, Text, etc.)
- **HOC Pattern**: `withChart` for wrapping chart components
- **Provider Pattern**: React context for chart data and state management

### Chart Libraries
- Modular chart implementations in `src/chartLibraries/`
- Separate chart types: dygraph, d3pie, gauge, bars, table, etc.
- Each chart library implements standard interface

### File Organization
```
src/
├── chartLibraries/     # Chart type implementations
├── components/         # React UI components  
├── sdk/               # Core SDK functionality
└── helpers/           # Utility functions
```

## Build System

### Distribution Targets
- **CommonJS**: `dist/` directory for Node.js compatibility
- **ES6**: `dist/es6/` directory for modern bundlers
- **Module resolution**: `@/` alias for src directory

### Development Workflow
1. Make changes in appropriate source files
2. Run `yarn to-cloud` to copy built assets to cloud-frontend
3. Test changes in consuming applications

## Testing Philosophy

- **Jest** with jsdom environment
- **Simple unit tests** focused on component rendering
- **Minimal coverage thresholds** (1% for branches/functions)
- **DOM testing** for rendered elements
- Test files colocated with source: `*.test.js`

## Key Dependencies

- **React 19** (peer dependency)
- **Styled Components 6** for styling
- **D3.js ecosystem** for visualizations
- **Dygraphs** for time series charts
- **@netdata/netdata-ui** for base components

## Important Notes

### Styling
- Use theme-based colors: `"mainChartBorder"`, `"borderSecondary"`, etc.
- Extend base components from @netdata/netdata-ui
- Support responsive design with height/width props

### State Management
- Chart state managed via SDK attributes
- React context for sharing chart data
- Custom hooks for chart-specific logic

### State Persistence for Virtualization
- **Store ALL persistent state in chart attributes** - any state that should survive virtualization scrolling
- **UI state examples**: `drawer.action`, `drawer.tab`, `drawer.showAdvancedStats`, `groupBy`, `expanded` states
- **Data state examples**: `comparePeriods`, `drilldownWeightsData`, `customPeriods`  
- **Loading/error states**: `compareLoading`, `compareError`, `weightsLoading`, `weightsError`
- **Access via useAttributeValue** for automatic reactivity and event listening
- **Create custom useSelector hooks** when combining multiple attributes or complex logic
- **Avoid React useState** for any state that needs to persist across component unmount/remount

### Plugin System
- Plugins registered at SDK level
- Extend chart functionality without modifying core
- Examples: hover interactions, pan/zoom, selection

Always check existing patterns and components before implementing new functionality. Reuse is strongly preferred over recreation.

## Developer Reminders

- **CRITICAL TESTING RULE**: NEVER MOCK ANYTHING! Use real imports and actual components/libraries
- Whenever you are about to mock, or you see a test missing its mock, DO NOT MOCK!!!! Check and import actual file/library first. If we are working with charts use makeTestChart and rest of testUtilities!
- **NO JEST MOCKS ALLOWED** - Use real components, real providers, real everything
- **SUPER IMPORTANT**: Always use actual imports - never mock @netdata/netdata-ui, never mock providers, never mock any components