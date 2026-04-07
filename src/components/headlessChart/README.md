# HeadlessChart Component

A headless chart component that provides data and helper functions for building custom React components with Netdata chart data.

## Features

- **Headless Architecture**: No UI, just data and helper functions
- **Multiple Usage Patterns**: Both render prop and React context patterns
- **Full SDK Integration**: Works with the existing Netdata charts SDK
- **Reactive Data**: Automatically updates when chart data changes
- **Helper Functions**: Provides all necessary chart utilities

## Usage

### Basic Usage with Render Prop

```javascript
import HeadlessChart from "@/components/headlessChart"
import makeDefaultSDK from "@/makeDefaultSDK"

const MyCustomComponent = () => {
  const sdk = makeDefaultSDK()

  return (
    <HeadlessChart
      sdk={sdk}
      contextScope={["system.load"]}
      host="http://localhost:19999/api/v3"
      agent
    >
      {({ data, helpers, state, currentRow }) => (
        <div>
          {state.loading && <div>Loading...</div>}
          {state.empty && <div>No data available</div>}
          {data.length > 0 && (
            <div>
              Latest value: {currentRow.formattedTime}
              <div>
                {currentRow.dimensions.map(dim => (
                  <span key={dim.id}>
                    {dim.id}: {dim.convertedValue}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </HeadlessChart>
  )
}
```

### Usage with React Context and Hook

```javascript
import HeadlessChart, { useHeadlessChart } from "@/components/headlessChart"

const CustomTable = () => {
  const { data, currentRow, helpers, state } = useHeadlessChart()

  if (state.loading) return <div>Loading...</div>
  if (state.empty) return <div>No data</div>

  return (
    <table>
      <thead>
        <tr>
          <th>Timestamp</th>
          {helpers.getVisibleDimensionIds().map(id => (
            <th key={id}>{id}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.slice(-10).map(row => (
          <tr key={row.timestamp}>
            <td>{row.formattedTime}</td>
            {row.dimensions.map(dim => (
              <td key={dim.id}>{dim.convertedValue}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const App = () => {
  const sdk = makeDefaultSDK()

  return (
    <HeadlessChart
      sdk={sdk}
      contextScope={["system.load"]}
      host="http://localhost:19999/api/v3"
      agent
    >
      <CustomTable />
    </HeadlessChart>
  )
}
```

## API Reference

### HeadlessChart Props

| Prop                 | Type                  | Description                                                    |
| -------------------- | --------------------- | -------------------------------------------------------------- |
| `sdk`                | Object                | Chart SDK instance (optional, creates default if not provided) |
| `children`           | Function or ReactNode | Render prop function or React components                       |
| `...chartAttributes` | Object                | Any chart attributes (contextScope, host, agent, etc.)         |

### Render Prop Function Parameters

The render prop function receives the same object as the `useHeadlessChart` hook:

| Parameter      | Type   | Description                                |
| -------------- | ------ | ------------------------------------------ |
| `chart`        | Object | Chart instance                             |
| `data`         | Array  | Processed chart data with formatted values |
| `currentRow`   | Object | Current/latest row data                    |
| `dimensionIds` | Array  | Available dimension IDs                    |
| `helpers`      | Object | Helper functions                           |
| `state`        | Object | Chart state (loading, empty, error, etc.)  |
| `attributes`   | Object | Chart attributes                           |

### useHeadlessChart Hook Return

| Property       | Type   | Description                                |
| -------------- | ------ | ------------------------------------------ |
| `chart`        | Object | Chart instance                             |
| `data`         | Array  | Processed chart data with formatted values |
| `currentRow`   | Object | Current/latest row data                    |
| `dimensionIds` | Array  | Available dimension IDs                    |
| `helpers`      | Object | Helper functions                           |
| `state`        | Object | Chart state (loading, empty, error, etc.)  |
| `attributes`   | Object | Chart attributes                           |

### Helper Functions

- `updateAttribute(name, value)` - Update chart attribute
- `getAttribute(name, defaultValue)` - Get chart attribute
- `getDimensionIds()` - Get all dimension IDs
- `getVisibleDimensionIds()` - Get visible dimension IDs
- `getDimensionValue(id, index)` - Get formatted dimension value
- `getClosestRow(timestamp)` - Get closest row index for timestamp
- `formatTime(timestamp)` - Format timestamp as time
- `formatDate(timestamp)` - Format timestamp as date
- `getConvertedValue(value)` - Get converted/formatted value
- `selectDimensionColor(id)` - Get dimension color
- `isDimensionVisible(id)` - Check if dimension is visible
- `focus()` - Focus chart
- `blur()` - Blur chart
- `getId()` - Get chart ID
- `trigger(event, data)` - Trigger chart event
- `on(event, callback)` - Subscribe to chart event
- `off(event, callback)` - Unsubscribe from chart event
- `onAttributeChange(name, callback)` - Subscribe to attribute changes
- `onceAttributeChange(name, callback)` - Subscribe to attribute changes once

## Examples

See `headlessChart.stories.js` and `agentv2.stories.js` for complete examples.

---

# BreakdownChart & useGroupedChart

A single chart context with `groupBy` split into N groups — one per instance or label value. Renders multiple gauges/pies/custom UI from a single data fetch.

## Imports

```js
import { BreakdownChart, useGroupedChart, HeadlessChart } from "@netdata/charts"
```

## Usage Option 1: BreakdownChart with renderFunction

`BreakdownChart` wraps `HeadlessChart` internally. Pass it the same props you'd pass `HeadlessChart`, plus an optional `renderFunction` for full control.

```jsx
<BreakdownChart
  sdk={sdk}
  contextScope={["httpcheck.responsetime"]}
  host="https://your-netdata-host/api/v3"
  agent={true}
  chartLibrary="gauge"
  groupBy={["instance"]}
  renderFunction={(groups, { chart, helpers, state }) => {
    if (state.loading && !state.loaded) return <Text>Loading...</Text>
    if (!groups.length) return <Text>No groups</Text>

    return (
      <Flex flexWrap gap={3}>
        {groups.map(group => (
          <Flex key={group.key} column padding={[3]} basis="200px">
            <Text strong>{group.label}</Text>
            <Text variant="h3">{Math.round(group.value)} ms</Text>
            <Text variant="caption">
              Range: {Math.round(group.min)} - {Math.round(group.max)}
            </Text>
          </Flex>
        ))}
      </Flex>
    )
  }}
/>
```

If you omit `renderFunction`, it renders a default grid showing each group's label and aggregated value.

## Usage Option 2: HeadlessChart + useGroupedChart hook

For more control, use `HeadlessChart` directly and call the `useGroupedChart` hook inside a child component.

```jsx
const MyGauges = () => {
  const { groups, state } = useGroupedChart()

  if (state.loading && !state.loaded) return <Text>Loading...</Text>
  if (!groups.length) return <Text>No groups</Text>

  return (
    <Flex flexWrap gap={4}>
      {groups.map(group => (
        <MyGaugeCard key={group.key} group={group} />
      ))}
    </Flex>
  )
}

<HeadlessChart
  sdk={sdk}
  contextScope={["httpcheck.responsetime"]}
  host="https://your-netdata-host/api/v3"
  agent={true}
  chartLibrary="gauge"
  groupBy={["instance"]}
>
  <MyGauges />
</HeadlessChart>
```

## BreakdownChart Props

All `HeadlessChart` props are forwarded, plus:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `renderFunction` | `(groups, { chart, helpers, state }) => ReactNode` | `undefined` | Custom render function. Receives groups array and chart context. If omitted, renders default grid. |
| `sharedMinMax` | `boolean` | `false` | When true, all groups share the same min/max range (for visual comparability). When false, each group has independent min/max. |
| `children` | `ReactNode` | `undefined` | If provided, renders children instead of GroupedRenderer (escape hatch). |

## useGroupedChart API

```js
const { groups, chart, helpers, state } = useGroupedChart({ sharedMinMax: false })
```

Must be called inside a `HeadlessChart` or `BreakdownChart` (needs chart context).

### `groups` — Array of group objects

Each group object:

```js
{
  key: "httpcheck_website-a",     // unique group identifier (tree key)
  label: "httpcheck_website-a",   // display label (same as key)
  dimensionIds: [                  // full dimension IDs belonging to this group
    "responsetime,httpcheck_website-a,node-001,httpcheck.responsetime"
  ],
  value: 42,                       // aggregated sum of all dimensions in this group
  dimensions: [                    // per-dimension breakdown
    {
      id: "responsetime,httpcheck_website-a,node-001,httpcheck.responsetime",
      value: 42,                   // raw value
      convertedValue: "42 ms",     // formatted with units
      color: "#5470c6",            // chart color
      name: "responsetime,...",    // dimension name
    }
  ],
  min: 42,                         // min value across this group's dimensions
  max: 42,                         // max value across this group's dimensions
}
```

### `chart`, `helpers`, `state` — Passthrough from useHeadlessChart

- `chart` — the SDK chart instance (all chart methods available)
- `helpers` — `{ updateAttribute, getAttribute, getDimensionValue, formatTime, selectDimensionColor, ... }`
- `state` — `{ loading, empty, loaded, error, showingInfo, focused }`

## Key Chart Attributes

These are passed as props to `BreakdownChart` or `HeadlessChart`:

| Attribute | Example | Description |
|-----------|---------|-------------|
| `contextScope` | `["httpcheck.responsetime"]` | The metric context to query |
| `groupBy` | `["instance"]` | How to group dimensions. Options: `"instance"`, `"dimension"`, `"node"`, `"context"`, `"label"` |
| `groupByLabel` | `["site"]` | When groupBy includes `"label"`, specifies which label key to group by |
| `chartLibrary` | `"gauge"` | Chart type. Used by default renderer to infer component type |
| `host` | `"https://host/api/v3"` | Netdata API endpoint |
| `agent` | `true` | Use agent API mode |
| `aggregationMethod` | `"avg"` | How to aggregate: `"sum"`, `"avg"`, `"min"`, `"max"` |

## How Grouping Works

1. The SDK fetches data with `groupBy` — the API returns dimension labels in comma-separated format: `"dimension,instance,nodeId,context"`
2. `camelizePayload` builds a nested tree from these labels
3. `useGroupedChart` finds the branching level in the tree (skips single-child nodes) and treats each branch as a group
4. Each group gets its leaf dimension IDs, resolved values, colors, and aggregated totals

## Storybook

See `breakdownChart.stories.js` for complete examples:

- **Default** — gauge breakdown with default grid rendering
- **WithRenderFunction** — custom styled cards via renderFunction
- **PieBreakdown** — same data rendered as d3pie
- **WithHook** — HeadlessChart + useGroupedChart direct usage

## Testing

Run tests with:

```bash
yarn test --testPathPattern="headlessChart"
```
