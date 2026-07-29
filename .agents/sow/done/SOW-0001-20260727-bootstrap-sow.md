# SOW-0001 - Bootstrap Project-Local SOW Framework

## Status

Status: completed

Sub-state: Framework installed, project memory preserved and normalized, maintainer guidance source-verified, and all bootstrap audits clean.

## Requirements

### Purpose

Install a self-contained, source-verified SOW framework for `@netdata/charts` while preserving project memory, maintainer guidance, public consumer contracts, and the repository's current development rules.

Bootstrap mode: Existing stable project.

### User Request

Initialize the project-local SOW system. Before implementation, inspect maintainer-provided planning artifacts, sibling Netdata frontend repositories, and maintainer-authored skills. Preserve useful guidance, but treat current source code as the factual authority.

### Assistant Understanding

Facts:

- `@netdata/charts` is an existing published frontend SDK and chart library with colocated Jest tests and CJS/ES6 distributions.
- The root `AGENTS.md` contains useful project instructions but no SOW runtime contract.
- Cross-tool bridges already exist locally: `CLAUDE.md -> AGENTS.md`, `GEMINI.md -> AGENTS.md`, and `.claude/skills -> ../.agents/skills`.
- `TODO.md` is a detailed pending uPlot migration contract, not a casual note.
- `docs/sow-heatmap-axis-ordering.md` is a completed historical implementation ledger.
- Charts contains no `docs/superpowers/` content in the worktree or available Git refs; `.superpowers` and `docs/superpowers` are intentionally ignored.
- Cloud Frontend tracks maintainer-authored `netdata-charts` and `netdata-ui` skills. The separately supplied `netdata-ui` skill is byte-identical to the tracked Cloud Frontend copy.
- Current source contradicts parts of those skills, including dependency versions, default plugins, hook inventory, icons, and theme tokens. The skills themselves state that source code wins.

Inferences:

- The correct durable model is to preserve maintainer intent, refresh factual reference material against current source, and keep source-specific runtime hooks local to Charts.
- Cloud-specific orchestration and testing workflows do not belong in the Charts runtime contract.

Unknowns:

- None block this bootstrap. Future uPlot implementation remains blocked by its own required-base checks.

### Acceptance Criteria

- Existing project instructions are preserved, with the three approved stale facts corrected from current manifests/configuration.
- The project contains a complete local SOW layout, local template, local audit, cross-tool bridges, and clone-safe tracked contents.
- `TODO.md` is preserved and normalized as an open pending uPlot SOW.
- The historical heatmap ledger is preserved and normalized as a completed SOW under `done/`.
- Runtime skills exist for Charts development, testing, and netdata-ui usage.
- The maintainer netdata-ui skill is copied locally and refreshed against current netdata-ui source.
- A local spec records the current public/consumer Charts contract.
- SOW audit, sensitive-data scan, cross-tool audit, and `git diff --check` pass.
- The bootstrap deployment ledger records this repository's resulting state.

## Analysis

Sources checked:

- `AGENTS.md`
- `.gitignore`
- `README.md`
- `package.json`
- `babel.config.js`
- `eslint.config.js`
- `jest/config.js`
- `jest/testUtilities/`
- `src/index.js`
- `src/makeDefaultSDK.js`
- `src/components/provider/selectors.js`
- `TODO.md`
- `docs/sow-heatmap-axis-ordering.md`
- Recent project history and all available local/remote refs for instruction and skill paths.
- `netdata/cloud-frontend @ bf2ba8182cff`
  - `AGENTS.md`
  - `AGENTS.parent.md`
  - `CLAUDE.md`
  - `TEAM_PROCESS.md`
  - `.claude/skills/netdata-charts/`
  - `.claude/skills/netdata-ui/`
  - `.claude/skills/netdata-cloud-frontend-testing/`
  - `docs/superpowers/`
- `netdata/netdata-ui @ 15dabecbc6a0`
  - `src/index.js`
  - `src/components/icon/iconsList.js`
  - `src/theme/default/colors.js`
  - `src/theme/dark/colors.js`
  - documented component, mixin, theme, and icon source paths.

Current state:

- SOW is not initialized.
- Initial SOW audit reports all required SOW sections and directories missing, while all cross-tool bridges pass.
- Existing `AGENTS.md` says Charts builds UMD, uses 1% coverage thresholds, and requires React 19 as a peer. Current source proves CJS/ES6 outputs, 40-50% global coverage thresholds, and React `>=18.2.0` peers.
- The repository has no installed dependencies sufficient to run lint: `yarn lint` exits 127 because `eslint` is unavailable.
- Existing source contains legacy mocked tests despite the current hard rule prohibiting new mocks. Those tests are not precedent and are outside this bootstrap's product-code scope.

Risks:

- Instruction loss if the SOW template replaces rather than merges existing `AGENTS.md` content.
- Duplicate or stale truth if sibling skills are copied without source verification.
- Planning history loss if root TODO or historical SOW files are removed before their content is preserved.
- False validation claims because product lint/tests cannot run without installed dependencies.
- Cross-repository drift if Cloud Frontend consumer skills are treated as Charts source authority.

## Pre-Implementation Gate

Status: ready

Problem / root-cause model:

- The repository has valuable project instructions and planning memory, but no project-local lifecycle, specs ledger, runtime skill hooks, sensitive-data guardrails, or local audit. Sibling maintainer skills add useful intent but are consumer-oriented and already drift from current source. A non-destructive, source-verified merge is required.

Evidence reviewed:

- Project manifests, runtime entrypoints, SDK composition, provider selectors, test configuration, test utilities, planning files, history, and initial audit.
- `netdata/cloud-frontend @ bf2ba8182cff` with repository-relative instruction, skill, and `docs/superpowers/` paths.
- `netdata/netdata-ui @ 15dabecbc6a0` with repository-relative public export, icon, component, mixin, and theme source paths.

Affected contracts and surfaces:

- Root agent instructions and cross-tool instruction loading.
- Project-local SOW lifecycle, audit, specs, and runtime skill discovery.
- Public consumer contract documentation for package entrypoints, deep imports, SDK defaults, attributes, and peer dependencies.
- Existing pending uPlot contract and completed heatmap implementation history.
- One-time global bootstrap deployment status.
- No runtime JavaScript, package API, user interface, build output, or published documentation behavior changes.

Existing patterns to reuse:

- Existing root project instructions and commands.
- Project-local bootstrap templates and audit copied into the repository, not symlinked.
- Current source as authority for package, SDK, hooks, themes, components, and icons.
- Maintainer-authored skill structure and trigger language where facts remain valid.
- Existing `.agents/skills` canonical directory and `.claude/skills` relative bridge.

Risk and blast radius:

- Changes are limited to instructions, SOW memory, specs, project skills, symlinks already created, and `.gitignore` tracking behavior.
- Moving tracked planning files changes paths but preserves content; user explicitly approved both moves.
- Correcting stale instructions may alter future assistant behavior, but each correction is directly supported by current project configuration.
- Imported maintainer references can drift again; update rules and source-authority warnings will make that maintenance explicit.

Sensitive data handling plan:

- This work does not require secrets, customer/community data, production logs, private endpoints, or proprietary incident details.
- Durable artifacts will contain only repository-relative paths, sanitized descriptions, and upstream repository/commit citations.
- Personal workstation paths and identities embedded in sibling reference material will not be copied into project artifacts.

Implementation plan:

1. Preserve the original `AGENTS.md` as `AGENTS.md.pre-sow.bak` and merge the local SOW runtime contract without dropping project-specific rules.
2. Normalize the root uPlot TODO into pending SOW-0002 and the historical heatmap ledger into completed SOW-0003, preserving their content.
3. Add a current public/consumer contract spec derived from Charts source and verified Cloud Frontend consumption.
4. Add source-derived runtime skills for Charts development and testing.
5. Copy and refresh the maintainer netdata-ui reference skill, then add a `project-netdata-ui` runtime wrapper.
6. Validate local audit, sensitive-data scan, cross-tool bootstrap audit, links/paths, source-derived inventories, and diff hygiene.
7. Update the one-time bootstrap deployment ledger, complete this SOW, and move it to `done/` alongside the uncommitted work so all changes can be committed atomically.

Validation plan:

- `bash .agents/sow/audit.sh`
- `SOW_AUDIT_SENSITIVE_CHANGED=1 bash .agents/sow/audit.sh`
- Run the cross-tool `bootstrap-repo` audit from the active bootstrap tooling.
- Source-derived checks for netdata-ui public exports, icon inventory, and 148 shared theme tokens.
- Symlink target and SOW status/directory checks.
- Verify moved planning content against the original Git blobs.
- `git diff --check`
- Product tests/lint are not required for metadata-only changes; record the failed preflight showing dependencies are unavailable rather than claiming they passed.

Artifact impact plan:

- AGENTS.md: merge the complete SOW runtime contract and preserved/corrected project rules.
- Runtime project skills: add `project-charts-development`, `project-testing`, and `project-netdata-ui`; add the refreshed maintainer `netdata-ui` source reference.
- Specs: add the verified Charts public/consumer contract.
- End-user/operator docs: no published product docs change; existing legacy planning docs move into the SOW ledger by explicit approval.
- End-user/operator skills: the maintainer netdata-ui skill is a runtime/reference input for this repository, not a shipped Charts operator skill.
- SOW lifecycle: create SOW-0001, migrate uPlot planning to pending SOW-0002, migrate completed heatmap history to done SOW-0003, then complete SOW-0001 after validation.

Open-source reference evidence:

- `netdata/cloud-frontend @ bf2ba8182cff`
  - `.claude/skills/netdata-charts/SKILL.md`
  - `.claude/skills/netdata-charts/references/`
  - `.claude/skills/netdata-ui/`
  - `AGENTS.md`
  - `AGENTS.parent.md`
  - `CLAUDE.md`
  - `TEAM_PROCESS.md`
  - `docs/superpowers/`
- `netdata/netdata-ui @ 15dabecbc6a0`
  - `src/index.js`
  - `src/components/icon/iconsList.js`
  - `src/theme/default/colors.js`
  - `src/theme/dark/colors.js`

Open decisions:

- None. All bootstrap decisions are resolved below.

## Implications And Decisions

1. Correct three stale `AGENTS.md` facts. Decision: approved (`1A`). Use current package and Jest configuration while preserving all other project rules.
2. Move `TODO.md` into pending SOW-0002. Decision: approved (`2A`). Preserve its full contract and add canonical status/gate metadata.
3. Move `docs/sow-heatmap-axis-ordering.md` into completed SOW-0003. Decision: approved (`3B`). Preserve its full historical narrative and normalize lifecycle metadata.
4. Create focused runtime project skills. Decision: approved (`4A`). Add Charts development and testing hooks rather than leaving all workflows buried in `AGENTS.md`.
5. Use repository-tracked maintainer skills as provenance evidence but current source as factual authority. Decision: approved (`5A`). Refresh and wrap the netdata-ui skill; do not copy the stale Cloud Frontend `netdata-charts` consumer skill verbatim; record its verified contract locally as a spec.
6. Keep `.superpowers` and `docs/superpowers` ignored. They are absent from Charts and are not its runtime instruction system.
7. Do not copy Cloud Frontend's Claude-specific team roster/process or cloud-only testing workflow into Charts.

## Plan

1. Preserve and merge project instructions.
2. Normalize planning memory into the SOW ledger.
3. Install specs and project skills.
4. Audit and correct any structural or factual residuals.
5. Update deployment status and close atomically with the work.

## Execution Log

### 2026-07-27

- Ran the global bootstrap audit and confirmed SOW was not initialized.
- Inspected current project instructions, manifests, source architecture, tests, history, planning artifacts, and cross-tool bridges.
- Inspected maintainer-authored Cloud Frontend instructions, skills, team process, and `docs/superpowers` artifacts.
- Verified the separately supplied netdata-ui skill is byte-identical to the tracked Cloud Frontend copy.
- Verified material skill drift against current Charts and netdata-ui source.
- Recorded user decisions `1A`, `2A`, `3B`, `4A`, and `5A` before modifying existing project memory.
- Created the minimal local SOW scaffold, template, audit, and this active ledger.
- Preserved the original `AGENTS.md`, merged the full runtime contract, and corrected only the approved stale facts.
- Moved the uPlot contract to pending SOW-0002 and the historical heatmap ledger to completed SOW-0003; verified both original bodies remain byte-for-byte equivalent.
- Added the Charts consumer-contract spec and three focused runtime project skills.
- Imported the maintainer netdata-ui reference, refreshed it to 128 public exports, 476 icons, and 148 shared theme tokens, and added a runtime wrapper.
- Updated the bootstrap deployment ledger and completed default, changed-file, full-history, cross-tool, preservation, source-inventory, and diff-hygiene validation.

## Validation

Acceptance criteria evidence:

- Local SOW audit reports initialization complete and clean with all canonical sections, bridges, directories, framework files, statuses, gates, skill classifications, and TODO handling valid.
- Cross-tool bootstrap audit reports target state met `8/8`.
- `AGENTS.md.pre-sow.bak` preserves the original text; four trailing-whitespace-only differences were normalized so the committed backup passes diff hygiene.
- The original uPlot plan body and historical heatmap SOW body exactly match their normalized destination bodies.
- Approved factual corrections are present: CJS/ES6 outputs, actual Jest thresholds, React `>=18.2.0`, and netdata-ui `>=5.4.17`.
- Maintainer netdata-ui references match current source inventories: 128 public exports, 476 icons, and 148 tokens shared by default/dark themes.
- The bootstrap deployment ledger records this repository as clean.

Tests or equivalent validation:

- `bash .agents/sow/audit.sh` passed.
- Changed-file and full-history sensitive-data audit modes passed.
- Cross-tool bootstrap audit and manual symlink/realpath checks passed.
- `bash -n .agents/sow/audit.sh` passed.
- `git diff --check` and `git diff --cached --check` passed.
- Product JavaScript was not changed, so product tests/builds are not part of this metadata-only acceptance contract. Preflight `yarn lint` could not run because project dependencies are absent (`eslint: command not found`); no passing product-lint claim is made.

Real-use evidence:

- The project-local audit runs from the repository without global runtime dependencies.
- Claude, Gemini, and AGENTS paths resolve to the same instruction file; `.claude/skills` resolves to the canonical `.agents/skills` directory.
- The local audit discovers all installed project skills and classifies the maintainer reference through its runtime wrapper.

Reviewer findings:

- Self-review found one workstation absolute path in the active SOW validation plan; it was removed and the same-pattern scan was rerun clean.
- No external review was requested. This work changes project metadata and agent workflow only, not runtime code.

Same-failure scan:

- Scanned managed Markdown for workstation absolute paths and personal names; no findings remain.
- Compared imported netdata-ui public exports, icons, and theme tokens against current source; no inventory drift remains.
- Searched all available Charts refs for additional skills or `docs/superpowers`; none exist.
- Verified no root TODO remains outside the ledger and no orphan agent instruction file exists.

Sensitive data gate:

- Default, changed-file, and full-history local audit modes found no raw secrets, credentials, bearer tokens, SNMP communities, community/customer identifiers, personal data, customer-identifying public IPs, private endpoints, or proprietary incident details in scanned durable artifacts.
- Imported references contain no copied workstation absolute paths or personal names.

Artifact maintenance gate:

- AGENTS.md: merged SOW runtime contract, source-verified project facts, skill index, preserved project overrides, and initialization marker.
- Runtime project skills: added `project-charts-development`, `project-testing`, and `project-netdata-ui`; imported/refreshed `netdata-ui` is wrapped and classified.
- Specs: added `.agents/sow/specs/charts-public-consumer-contract.md`.
- End-user/operator docs: no published product behavior or documentation changed. The approved legacy planning files were moved into the SOW ledger with their bodies preserved.
- End-user/operator skills: no Charts output/operator skill exists in this repository. The imported netdata-ui artifact is a runtime/reference input and was refreshed against source.
- SOW lifecycle: SOW-0002 is open in `pending/`; SOW-0003 is completed in `done/`; this SOW is completed and moved to `done/` with the same uncommitted change set so it can be committed atomically.

Specs update:

- Added the current package entrypoint, deep-import, peer, SDK, attribute, interaction, and consumer-validation contract.

Project skills update:

- Added three trigger-driven runtime skills and one source-verified maintainer reference with a project wrapper.

End-user/operator docs update:

- No end-user documentation update was needed because no package behavior, command, schema, default, or visible feature changed.

End-user/operator skills update:

- No shipped Charts operator skill was affected. Cloud Frontend's consumer skill was read as evidence but intentionally not copied because current source already contradicts parts of it; the verified contract now lives in the local spec.

Lessons:

- Repository tracking establishes provenance, not factual freshness; source-derived validation is still required.
- `docs/superpowers` contains feature planning history, not runtime agent rules.
- A non-`project-*` maintainer skill can remain intact while a small `project-*` wrapper supplies the local runtime trigger.

Follow-up mapping:

- The uPlot migration is represented by open pending SOW-0002 and remains blocked by its recorded required-base checks.
- Historical heatmap work is represented by completed SOW-0003; true regressions must reopen it.
- No bootstrap-framework follow-up remains.

## Outcome

The repository now has a self-contained, clean SOW framework with preserved project instructions, normalized planning memory, source-verified specs and skills, and working cross-tool bridges.

## Lessons Extracted

- Treat sibling skills as maintainer intent and current source as factual authority.
- Preserve imported detailed references under their established names and use focused `project-*` wrappers for runtime discovery.
- Verify planning-file migrations by comparing original Git blobs with normalized bodies, not by assuming a move preserved every line.

## Followup

The only active project follow-up is the separately tracked pending uPlot migration in SOW-0002.

## Regression Log

None yet.

Append regression entries here only after this SOW was completed or closed and later testing or use found broken behavior. Use a dated `## Regression - YYYY-MM-DD` heading at the end of the file. Never prepend regression content above the original SOW narrative.
