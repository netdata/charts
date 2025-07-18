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

## Testing

Run tests with:

```bash
yarn test --testPathPattern="headlessChart"
```
