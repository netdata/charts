export default {
  id: "",
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
  loaded: false,
  loading: false,
  updatedAt: 0,
  fetchStartedAt: 0,
  focused: false,
  active: false,
  sparkline: false,
  chartType: "",
  selectedDimensions: null,
  enabledHover: true,
  syncHover: true,
  hoverX: null,
  navigation: "",
  enabledNavigation: true,
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

  composite: false,
  aggregationMethod: "",
  dimensions: [],
  dimensionsAggregationMethod: "",
  groupBy: "",

  aggregationGroups: [],
  postAggregationMethod: "",
  postGroupBy: "",
  selectedChart: "",

  pristineComposite: {},

  themeTrackColor: ["#ECEEEF", "#383B40"],
  themeScaleColor: ["#F7F8F8", "#2B3136"],

  themeGaugePointer: ["#8F9EAA", "#536775"],
  themeGaugeStroke: ["#ECEEEF", "#383B40"],
}
