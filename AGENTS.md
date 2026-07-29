# AGENTS.md

This file provides guidance to coding agents working in this repository.

## Goals

`@netdata/charts` is Netdata's frontend SDK and chart utilities library. It provides React chart components, SDK/state infrastructure, renderers, interactions, and visualization helpers consumed by Netdata frontends.

Success means preserving public/de facto consumer contracts and visible chart behavior while delivering reliable, maintainable, performant changes. The package currently builds CommonJS and ES6 distributions and is consumed alongside `@netdata/netdata-ui`.

## SOW System

This project uses a local Statement of Work system.

The SOW system is self-contained in this repository. Normal SOW work must not depend on `~/.agents`, global agent instructions, global skills, global templates, or global scripts. Use this `AGENTS.md`, project-local SOW files, project-local specs, project-local skills, and the active SOW.

### Roles

- **User responsibilities:** purpose, scope decisions, design forks, risk acceptance, destructive approvals, and final product judgment.
- **Assistant responsibilities:** investigation, evidence, implementation, tests or equivalent validation, reviews, documentation, memory updates, and concise reporting.

### Required First Checks

Before creating a SOW or starting non-trivial implementation:

1. Confirm the user has requested implementation.
2. Inspect code/docs/data to establish whether a change is needed.
3. Read pending/current SOWs for overlap, contradictions, and existing decisions.
4. Read relevant specs under `.agents/sow/specs/`.
5. Inspect `.agents/skills/project-*/SKILL.md` and load every runtime project skill whose trigger matches the work.
6. Ask the user only for irreducible product/design/risk decisions.

### Git Worktrees

Assistants must not create git worktrees on their own. Create a git worktree only when the user explicitly asks for it or approves it.

### Sensitive Data In Durable Artifacts

SOWs, specs, documentation, project skills, agent instructions, and code comments are commit-ready artifacts. Treat them as public unless a repository-specific policy explicitly says otherwise.

CRITICAL: Never write raw sensitive data to durable artifacts. This includes passwords, API keys, bearer tokens, SNMP communities, private keys, connection strings with embedded credentials, session cookies, community member names, customer names, customer identifiers, personal data, non-private IP addresses that can identify customers, private endpoints, account IDs, and proprietary incident details.

Write only sanitized evidence:

- use placeholders such as `[REDACTED_SECRET]`, `[CUSTOMER]`, `[ACCOUNT]`, `[PRIVATE_ENDPOINT]`;
- use stable aliases such as `customer-a` only when the real mapping is not stored in the repository;
- cite file paths, line numbers, command names, schema fields, or error classes instead of copying sensitive values;
- summarize logs and traces; include only minimal redacted snippets.

If sensitive data is required to continue, stop and ask the user for a secure handling path. If sensitive data is found in a durable artifact, sanitize it before any commit. If sensitive data was already committed, tell the user and do not rewrite history without explicit approval.

### Open-Source Reference Evidence

When a SOW uses external open-source repositories as evidence, record the upstream repository identity and checked commit, not the workstation mirror path.

For local mirrored or cloned open-source repositories, cite evidence in this form:

```text
owner/repo @ commit
relative/path/inside/repo:line
```

Rules:

- Never use workstation absolute paths for external open-source evidence in SOWs.
- Resolve `owner/repo` from the repository remote, not only from the local directory name.
- Record the commit with `git -C <repo> rev-parse --short=12 HEAD` or the full hash when precision matters.
- Use paths relative to the upstream repository root after the `owner/repo @ commit` line.
- If multiple repositories were checked, list each repository and commit separately.

### Pre-Implementation Gate

Implementation covered by a SOW must not begin until the SOW contains a concrete `## Pre-Implementation Gate` section. Before moving a SOW from `pending/open` to `current/in-progress`, or before continuing implementation in an existing current SOW that lacks this section, fill the gate.

The gate must record:

- Problem / root-cause model: what is happening, why it is happening, and what evidence supports that model.
- Evidence reviewed: specs, code, docs, tests, logs, traces, prior SOWs, issues, or external references checked. Open-source references from local mirrors or clones must be cited as `owner/repo @ commit` plus repository-relative paths, never as workstation absolute paths.
- Affected contracts and surfaces: APIs, schemas, files, commands, UI, docs, specs, skills, tests, integrations, operators, users.
- Existing patterns to reuse: local modules, helpers, conventions, tests, and docs that should shape the implementation.
- Risk and blast radius: regressions, compatibility, performance, security, data loss, migration, rollout, and operational risks.
- Sensitive data handling plan: whether the work may expose secrets, credentials, bearer tokens, SNMP communities, community/customer data, personal data, non-private customer-identifying IPs, private endpoints, or proprietary incident details; how evidence will be redacted in SOWs, specs, docs, skills, instructions, and code comments.
- Implementation plan: ordered chunks with scope, dependencies, and files or modules likely to change.
- Validation plan: tests, fixtures, manual checks, real-use evidence, review passes, and same-failure searches.
- Artifact impact plan: expected updates to `AGENTS.md`, runtime project skills, specs, end-user/operator docs, end-user/operator skills, and SOW lifecycle.
- Open decisions: resolved decisions or numbered options for the user; unresolved decisions block implementation.

Generic placeholders such as `TBD`, `N/A`, or "to be checked later" are invalid unless the SOW explains why the item truly does not apply. If the gate exposes an unknown that cannot be resolved by investigation, stop and ask the user before implementation.

### When A SOW Is Required

Create or reuse a SOW only after the user requests implementation and preliminary analysis confirms a non-trivial change is needed.

Questions, discussions, reviews, status reports, and read-only investigation do not need a SOW. Trivial implementation such as typo or formatting-only fixes does not need one.

When unsure whether a change is needed, investigate first. When an authorized change has unclear risk, treat it as non-trivial.

### SOW Locations

- Pending: `.agents/sow/pending/`
- Current: `.agents/sow/current/`
- Done: `.agents/sow/done/`
- Specs: `.agents/sow/specs/`
- Template for new SOWs: `.agents/sow/SOW.template.md`
- Local audit: `.agents/sow/audit.sh`

Create new SOW files from `.agents/sow/SOW.template.md`. The template is project-local and may be customized for this repository.

Empty SOW directories must contain `.gitkeep` or `.keep` so the committed repository preserves the full SOW layout after clone/checkout.

Filename:

```text
SOW-NNNN-YYYYMMDD-{slug}.md
```

Status and directory must agree:

- `open` lives in `pending/`
- `in-progress` lives in `current/`
- `paused` lives in `current/`
- `completed` lives in `done/`
- `closed` lives in `done/`

### SOW Completion And Commit

The successful terminal SOW status is `completed`. `done` is a directory name, not a status value. Never write `Status: done` or `Status: complete`.

When a SOW's work is ready to close:

1. Finish implementation, docs, specs, skills, validation, and follow-up mapping.
2. Update the SOW to `Status: completed`.
3. Move the SOW file to `.agents/sow/done/`.
4. Commit the work, artifact updates, SOW status change, and SOW move together as one commit, unless the user explicitly requested a different commit split.

Do not create a separate commit just to mark or move the SOW. Do not claim a SOW is completed while the implementation and the SOW lifecycle change live in separate uncommitted or separately committed states.

### One SOW At A Time

Never execute multiple SOWs as one batch.

If work overlaps:

- merge or consolidate before implementation; or
- split into separate SOWs and complete one before starting the next.

Progress reports are not stop points. Once a SOW is in progress, continue until it is delivered, failed with evidence, blocked on a real user decision/approval, or superseded by newer user instructions.

### User Decisions

When user decisions are needed:

1. Present concrete evidence with files/lines or source references.
2. Provide numbered options.
3. Explain pros, cons, implications, and risks.
4. Recommend one option with reasoning.
5. Record the user's decision in the SOW before implementation.

### Followup Discipline

"Deferred" is not a terminal outcome.

Before a SOW can close, every valid deferred item must be:

- implemented in the current SOW; or
- explicitly rejected as not worth doing, with evidence; or
- represented by a real pending/current SOW file.

Pre-close, search the SOW for:

```text
defer|later|follow-up|future|TODO|pending
```

Map every remaining item to implemented, rejected, or tracked.

### Regressions

A regression is discovered after a SOW was considered completed or closed, later testing or use finds broken behavior, and the original SOW's claimed outcome is no longer true.

When behavior that a completed SOW claimed working stops working:

1. Find the original SOW in `done/`.
2. Move it back to `current/`.
3. Mark it `in-progress` with a regression note in `## Status`.
4. Append a new dated `## Regression - YYYY-MM-DD` section at the end of the file, after the original outcome, lessons, and follow-up content.
5. In that appended section, record what broke, evidence, why previous validation missed it, the repair plan, validation, and updates needed to specs, skills, docs, audits, or follow-up SOWs.
6. Fix and validate there.

Never prepend regression content above the original SOW narrative. The original requirements, analysis, plan, validation, outcome, lessons, and follow-up must remain readable first.
Do not create a new SOW for a true regression.

### Validation Gate

A SOW cannot be completed until Validation records:

- acceptance criteria evidence;
- tests or equivalent validation;
- real-use evidence when a runnable path exists;
- reviewer findings and how they were handled;
- same-failure search results;
- sensitive data gate: durable artifacts contain no raw secrets, credentials, bearer tokens, SNMP communities, community member names, customer names, personal data, non-private customer-identifying IPs, private endpoints, or proprietary incident details;
- artifact maintenance gate for `AGENTS.md`, runtime project skills, specs, end-user/operator docs, end-user/operator skills, and SOW lifecycle;
- SOW status/directory consistency;
- spec update or specific reason no spec update was needed;
- project skill update or specific reason no skill update was needed;
- end-user/operator docs update or evidence-backed reason none were affected;
- end-user/operator skill update or evidence-backed reason none were affected by docs/spec changes;
- lessons extracted or specific reason there were none;
- follow-up mapping.

Generic "N/A" is invalid.

### Artifact Maintenance Gate

Every SOW close must explicitly record whether each durable artifact class was updated or why no update was needed:

- `AGENTS.md` - workflow, responsibility, local framework, project-wide guardrails.
- Runtime project skills - `.agents/skills/project-*/SKILL.md` for HOW to work here.
- Specs - `.agents/sow/specs/` for WHAT the project does.
- End-user/operator docs - README, docs site, runbooks, published guides, help text, or other human-facing documentation.
- End-user/operator skills - output/reference skills copied or consumed outside normal repo work.
- SOW lifecycle - split, merge, status, directory, deferred work, regression reopening, and follow-up mapping.

This is an assistant responsibility. If a SOW changes behavior, docs, specs, commands, schemas, defaults, workflows, examples, or operating procedure, the assistant must update every affected artifact in the same SOW, or record the evidence-backed reason an artifact is unaffected.

### Specs

Specs are memory of WHAT this project does.

Update specs when shipped work changes:

- product behavior;
- public contracts;
- data formats;
- UX rules;
- business logic;
- operational guarantees;
- known edge cases.

Specs describe current reality, not aspiration. If specs and code disagree, record the discrepancy in the active SOW and resolve or track it.

### Project Skills

Project skills are memory of HOW to work here.

Runtime input project skills live under `.agents/skills/project-*/SKILL.md`. Before non-trivial implementation, inspect those skill descriptions and load every matching runtime skill. Skill descriptions are mandatory hooks, not suggestions.

Non-`project-*` skills under `.agents/skills/` are not automatically runtime instructions. Their classification is recorded below.

Skills must be updated during retrospection when:

- the user corrects the workflow;
- a reviewer finds a repeated mistake;
- validation misses a failure mode;
- a new command or workflow becomes canonical;
- a new project hazard is discovered;
- a new best or bad practice is learned;
- a reference skill would otherwise become stale after a dependency/source change.

### Project Skills Index

Runtime input skills:

- `.agents/skills/project-charts-development/`
  Trigger: mandatory when changing SDK nodes, attributes, plugins, chart libraries/renderers, chart React components, package entrypoints, or consumer-facing integration.
  Enforces: source architecture, persistent attribute state, renderer seams, lifecycle cleanup, compatibility, and consuming validation.
- `.agents/skills/project-testing/`
  Trigger: mandatory when adding/changing tests, investigating regressions, or claiming Charts validation is complete.
  Enforces: real imports/providers/charts, `makeTestChart`, behavioral assertions, canonical commands, and honest validation reporting.
- `.agents/skills/project-netdata-ui/`
  Trigger: mandatory for netdata-ui components, styled-components, colors, spacing, typography, icons, and Figma-backed styling.
  Enforces: loading the maintainer reference, source verification, theme/token usage, component reuse, and light/dark validation.

Legacy runtime skills:

- `.agents/skills/netdata-ui/`
  Trigger: detailed netdata-ui component, mixin, theme, icon, and design-system review.
  Status: maintainer-provided reference preserved under its original name, refreshed against current source, and loaded through `.agents/skills/project-netdata-ui/`.

Output/reference skills:

- None currently. Consumer-facing Charts guidance remains owned by its consuming repository; the current contract is recorded in `.agents/sow/specs/charts-public-consumer-contract.md`.

### Project-specific commands

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

Development workflow:

1. Make changes in appropriate source files.
2. Run `yarn to-cloud` to copy built assets to cloud-frontend.
3. Test changes in consuming applications.

### Project-specific overrides

#### Code Style & Conventions

##### Formatting Standards

- **No semicolons** (consistent across all files)
- **Double quotes** for strings
- **2-space indentation** (no tabs)
- **100 character line width**
- **ES5 trailing commas**
- **Arrow functions** preferred over function declarations
- **Template literals** for dynamic strings

##### JavaScript Patterns

- **ES6 imports/exports** throughout
- **All imports at the top of file**: Never use require() or dynamic imports within function bodies
- **Destructuring** heavily used in function parameters
- **Props spreading** with `{...rest}` for prop forwarding
- **Conditional rendering** using `&&` and ternary operators
- **No comments** unless absolutely necessary for complex logic

##### React Conventions

- **Hooks-first approach**: Prefer custom hooks over class components
- **Composition over inheritance**: Build components from smaller pieces
- **JSX in .js files**: No .jsx extension required
- **React 19 automatic JSX transform**: No React import needed in component files

#### Architecture Patterns

##### SDK Pattern

- Central `makeSDK` function creates chart instances
- Plugin system for extending functionality (hover, pan, select, highlight)
- Attribute-based chart configuration

##### Component Architecture

- **Styled Components 6**: Primary styling solution with theme integration
- **@netdata/netdata-ui**: Base component library (Flex, Text, etc.)
- **HOC Pattern**: `withChart` for wrapping chart components
- **Provider Pattern**: React context for chart data and state management

##### Chart Libraries

- Modular chart implementations in `src/chartLibraries/`
- Separate chart types: dygraph, d3pie, gauge, bars, table, etc.
- Each chart library implements standard interface

##### File Organization

```text
src/
├── chartLibraries/     # Chart type implementations
├── components/         # React UI components
├── sdk/                # Core SDK functionality
└── helpers/            # Utility functions
```

#### Build System

##### Distribution Targets

- **CommonJS**: `dist/` directory for Node.js compatibility
- **ES6**: `dist/es6/` directory for modern bundlers
- **Module resolution**: `@/` alias for src directory

#### Testing Philosophy

- **Jest** with jsdom environment
- **Simple unit tests** focused on component rendering
- **Behavioral integration tests** use real components, providers, charts, and utilities
- **Global coverage thresholds**: 50% statements, 40% branches, 47% functions, and 50% lines
- **DOM testing** for rendered elements
- Test files colocated with source: `*.test.js`

#### Key Dependencies

- **React >=18.2.0** peer contract; React 19 is used for development
- **Styled Components >=5.3.9** peer contract; Styled Components 6 is used for development
- **D3.js ecosystem** for visualizations
- **Dygraphs** for time series charts
- **@netdata/netdata-ui >=5.4.17** for base components

#### Important Notes

##### Styling

- Use theme-based colors: `"mainChartBorder"`, `"borderSecondary"`, etc.
- Extend base components from @netdata/netdata-ui
- Support responsive design with height/width props
- Load `project-netdata-ui` before styling or design-system work.

##### State Management

- Chart state managed via SDK attributes
- React context for sharing chart data
- Custom hooks for chart-specific logic

##### State Persistence for Virtualization

- **Store ALL persistent state in chart attributes** - any state that should survive virtualization scrolling
- **UI state examples**: `drawer.action`, `drawer.tab`, `drawer.showAdvancedStats`, `groupBy`, `expanded` states
- **Data state examples**: `comparePeriods`, `drilldownWeightsData`, `customPeriods`
- **Loading/error states**: `compareLoading`, `compareError`, `weightsLoading`, `weightsError`
- **Access via useAttributeValue** for automatic reactivity and event listening
- **Create custom useSelector hooks** when combining multiple attributes or complex logic
- **Avoid React useState** for any state that needs to persist across component unmount/remount

##### Plugin System

- Plugins registered at SDK level
- Extend chart functionality without modifying core
- Examples: hover interactions, pan/zoom, selection

Always check existing patterns and components before implementing new functionality. Reuse is strongly preferred over recreation.

#### Developer Reminders

- **CRITICAL TESTING RULE**: NEVER MOCK ANYTHING! Use real imports and actual components/libraries
- Whenever you are about to mock, or you see a test missing its mock, DO NOT MOCK!!!! Check and import actual file/library first. If we are working with charts use makeTestChart and rest of testUtilities!
- **NO JEST MOCKS ALLOWED** - Use real components, real providers, real everything
- **SUPER IMPORTANT**: Always use actual imports - never mock @netdata/netdata-ui, never mock providers, never mock any components

### Preservation Notes

- The original `AGENTS.md` text is preserved as `AGENTS.md.pre-sow.bak`; four trailing-whitespace-only differences were normalized for commit hygiene.
- Original Project Context was merged into `## Goals`; the obsolete UMD claim was corrected from `package.json`.
- Original Essential Commands and Development Workflow were preserved under `### Project-specific commands`.
- Original style, architecture, build, testing, dependency, state, plugin, and testing rules were preserved under `### Project-specific overrides` and reinforced by focused project skills.
- The obsolete 1% coverage claim was corrected from `jest/config.js`.
- The React peer claim was corrected from `package.json`: peer support is React `>=18.2.0`, while development uses React 19.
- No project-specific instruction was deleted.
- `docs/superpowers/` is absent and intentionally remains ignored; Cloud Frontend planning artifacts were inspected as evidence but not copied.

Project SOW status: initialized
