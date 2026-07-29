---
name: project-netdata-ui
description: "Mandatory netdata-ui integration workflow when changing Charts React components, styled-components, theme colors, spacing, typography, icons, or netdata-ui imports. Use before styling implementation, design-system review, or claiming light/dark UI compliance."
---
# Charts netdata-ui Integration

## Purpose

Make Charts UI changes conform to the maintainer-provided netdata-ui design-system rules while verifying every API and token against current netdata-ui source.

## Scope

Use this skill when:

- importing or extending `@netdata/netdata-ui` components;
- changing styled-components, colors, spacing, typography, icons, controls, or layout;
- implementing a Figma-backed visual change;
- reviewing Charts for netdata-ui or light/dark theme compliance.

Do not use this skill for:

- canvas/SVG chart rendering values that use the Charts chart-theme system rather than netdata-ui components;
- SDK/data behavior with no UI or styling surface;
- Cloud Frontend-specific Jotai, navigation, or application layout work.

## Mandatory Knowledge

- Read `../netdata-ui/SKILL.md` before detailed implementation or review, then load only the needed component, mixin, theme, or icon reference.
- Current `netdata/netdata-ui` source is authoritative when the imported reference disagrees with source. The local reference was refreshed against `netdata/netdata-ui @ 15dabecbc6a0` during bootstrap.
- Prefer netdata-ui components and supported props over raw elements and duplicate local controls.
- Colors must resolve through netdata-ui/Charts theme tokens; do not hardcode visual colors.
- Value-like spacing/sizing should follow the design-system scale. CSS features may remain CSS, but values embedded inside them still use tokens/helpers.
- Charts has two related theme surfaces: styled-components/netdata-ui theme for React UI and chart attributes/theme helpers for chart internals. Keep them visually consistent without conflating their APIs.

## Best Practices

- Verify component props and public exports against the local netdata-ui reference and current dependency source before use.
- Use component props or `.attrs(...)` when the component already expresses the style.
- Extend `Flex`, `Box`, `Text`, `Button`, or another suitable netdata-ui primitive instead of raw DOM elements when styling React UI.
- Verify icon names against the current icon inventory; unknown names render nothing.
- Check visual changes in both light and dark themes.
- For Figma-backed work, obtain exact design context and a visual reference before coding. If design access is unavailable, request evidence instead of guessing values.

## Bad Practices

- Do not use raw hex/rgb/hsl colors, off-scale spacing, unsupported props, or invented icon names.
- Do not add `shouldForwardProp` or transient `$props`; the consuming application provides global prop filtering.
- Do not create empty styled wrappers or re-export wrappers that hide the actual netdata-ui component.
- Do not treat a stale reference list as stronger evidence than current package source.
- Do not use netdata-ui styling rules to rewrite canvas/chart-renderer internals that follow a separate Charts theme contract.

## Workflow Checklist

1. Read the active SOW and identify whether the change affects React UI, chart internals, or both.
2. Load `../netdata-ui/SKILL.md` and the minimum matching reference file.
3. Verify the relevant export, prop, token, mixin, or icon against current netdata-ui source when behavior is not explicit.
4. Map design values to existing components, props, tokens, and scale helpers.
5. Implement without raw visual values or duplicate local primitives.
6. Run focused component tests and Charts tests.
7. Check Storybook or the consuming application in light and dark themes.
8. Update the imported reference and this wrapper if current source changed the rule.

## Validation Checklist

Before claiming done:

- Every netdata-ui import and prop exists in the supported public surface.
- Colors, spacing, typography, and icons come from verified tokens/scales/inventories.
- Light and dark behavior is checked for visual changes.
- Existing netdata-ui components were considered before creating local UI.
- No raw styled element or one-off visual value bypasses the system without a documented feature-level reason.
- The local maintainer reference remains aligned with current dependency source.

## Evidence

- `.agents/skills/netdata-ui/SKILL.md`: imported maintainer review rules.
- `.agents/skills/netdata-ui/references/`: source-derived components, mixins, theme, and icon inventories.
- `package.json`: current `@netdata/netdata-ui` peer and development versions.
- `netdata/netdata-ui @ 15dabecbc6a0`: authoritative component, mixin, theme, and icon source.
- `src/components/`: current Charts netdata-ui integration patterns.

## Update Rules

Update this skill when:

- the netdata-ui dependency or public API changes;
- design-system review identifies a new Charts-specific misuse;
- Figma-to-token mapping or theme behavior changes;
- the imported maintainer skill is refreshed from newer source.
