export default {
  id: "",
  name: "",
  chartLibrary: "",
  theme: "default",
  host: "",
  description: "",
  before: 0,
  after: 0,
  title: "",
  min: 0,
  max: 0,
  updateEvery: 0,
  pristineValueRange: undefined,
  valueRange: null,
  getValueRange: ({ min = null, max = null, groupBy, valueRange, aggrMethod }) => {
    const minMax = min === max ? [0, max * 2] : [min || null, null]
    return groupBy.length === 1 && groupBy[0] === "dimension"
      ? valueRange || null
      : aggrMethod === "sum"
      ? minMax
      : valueRange || minMax
  },
  loaded: false,
  loading: false,
  updatedAt: 0,
  fetchStartedAt: 0,
  focused: false,
  active: false,
  sparkline: false,
  chartType: "",
  selectedLegendDimensions: [],

  contextScope: [],
  nodesScope: [],
  selectedContexts: [],
  selectedDimensions: [],
  selectedLabels: [],
  selectedNodes: [],
  selectedInstances: [],

  contextsHardHash: null,

  enabledHover: true,
  syncHover: true,
  hoverX: null,
  navigation: "",
  enabledNavigation: true,
  enabledResetRange: true,
  syncPanning: true,
  panning: false,
  hovering: false,
  syncHighlight: true,
  highlighting: false,
  desiredUnits: "auto",
  syncUnits: false,
  unitsConversionMethod: "",
  unitsConversionDivider: -1,
  unitsConversionFractionDigits: 0,
  unitsConversion: "",
  units: "",
  temperature: "celsius",
  secondsAsTime: true,
  timezone: undefined,
  syncTimezone: true,
  dimensionsSort: "default",
  autofetch: false,
  autofetchOnWindowBlur: false,
  paused: false,
  pixelsPerPoint: 1,
  legend: true,
  groupingMethod: "average",
  groupingTime: 0,
  chartUrlOptions: null,
  urlOptions: [],
  eliminateZeroDimensions: true,
  fullscreen: false,
  overlays: {},
  themeGridColor: ["#F7F8F8", "#282827"],
  themeCrosshair: ["#536775", "#536775"],
  detailed: false,
  colors: [],
  height: "",
  enabledHeightResize: true,
  pristineEnabledHeightResize: {},
  enabledXAxis: true,
  enabledYAxis: true,
  hasToolbox: true,
  yAxisLabelWidth: null, // default is most probably 50
  axisLabelFontSize: 10,

  outOfLimits: false,
  composite: false,
  aggregationMethod: "",
  dimensions: [],
  groupBy: [],
  groupByLabel: [],
  // selectedNodeIds: [], deprecate
  // selectedChartId: "", deprecate

  dimensionsSortBy: [{ id: "contribution", desc: true }],
  instancesSortBy: [{ id: "contribution", desc: true }],
  nodesSortBy: [{ id: "contribution", desc: true }],
  groupBySortBy: [],
  labelsSortBy: [{ id: "contribution", desc: true }],

  nodesExpanded: {},
  groupByExpanded: {},
  labelsExpanded: {},

  aggregationGroups: [],
  postGroupBy: "",
  selectedChart: "",
  // filteredLabels: {}, depreactae

  pristine: {},

  themeTrackColor: ["#ECEEEF", "#383B40"],
  themeScaleColor: ["#F7F8F8", "#2B3136"],

  themeGaugePointer: ["#8F9EAA", "#536775"],
  themeGaugeStroke: ["#ECEEEF", "#383B40"],

  themeLabelColor: ["#35414a", "#ffffff"],
  themeNeutralBackground: ["#ECEEEF", "#383B40"],
  themeWarningBackground: ["#FFCC26", "#FFCC26"],
  themeErrorBackground: ["#F95251", "#F95251"],

  legendScroll: 0,

  initializedFilters: false,
  renderDimensionChildren: null,
  error: null,

  shouldFetchMetadata: false,
  agent: true, // default should be false when ready for cloud
}
