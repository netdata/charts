import Fullscreen from "@/components/toolbox/fullscreen"
import Settings from "@/components/toolbox/settings"
import { DisplayTab, DataTab, InfoTab, DownloadTab } from "@/components/toolbox/settings/tabs"

import Status from "@/components/status"
import { DefaultTheme, DarkTheme } from "@netdata/netdata-ui/dist/theme"
import { withAlpha } from "@/chartLibraries/helpers/color"

const themeColors = name => [DefaultTheme.colors[name], DarkTheme.colors[name]]

export default {
  id: "",
  name: "",
  chartLibrary: "",
  timeSeriesRenderer: null,
  rendererOverridden: false,
  theme: "default",
  host: "",
  description: null,
  before: 0,
  after: 0,
  liveAfter: -900,
  anomalySpotlight: false,
  title: null,
  min: 0,
  max: 0,
  autofetchOnHovering: false,
  perfMonitor: false,

  pristineStaticValueRange: undefined,
  valueRange: null,
  staticValueRange: null,
  getValueRange: (chart, { dygraph = false } = {}) => {
    if (!chart) return [null, null]

    const {
      min = null,
      max = null,
      valueRange = [null, null],
      staticValueRange,
    } = chart.getAttributes()

    if (staticValueRange) return staticValueRange

    if (!valueRange || (valueRange[0] === null && valueRange[1] === null)) {
      if (dygraph) return [null, null]

      return [min, max]
    }

    const [rangeMin, rangeMax] = valueRange

    if (dygraph) {
      const { groupBy, aggregationMethod } = chart.getAttributes()

      if (groupBy.length > 1 || groupBy[0] !== "dimension" || aggregationMethod !== "avg")
        return [null, null]
    }

    const newValueRange = [
      rangeMin === null || rangeMin > min ? min : rangeMin,
      rangeMax === null || rangeMax < max ? max : rangeMax,
    ]

    return newValueRange
  },
  loaded: false,
  loading: false,
  processing: false,
  updatedAt: 0,
  fetchStartedAt: 0,
  focused: false,
  active: false,
  sparkline: false,
  chartType: "",
  stepPlot: false,
  selectedLegendDimensions: [],

  contextItems: [],
  contextScope: [],
  nodesScope: [],
  selectedContexts: [],
  selectedDimensions: [],
  selectedLabels: [],
  selectedNodes: [],
  selectedInstances: [],

  dimensionIds: [],
  versions: {},

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

  desiredUnits: ["auto"],
  staticFractionDigits: null,
  abs: true,

  unitsConversionMethod: [""],
  unitsConversionDivider: [-1],
  unitsConversionFractionDigits: [0],
  unitsConversionPrefix: [""],
  unitsConversionBase: [""],
  unitsConversionLabelMode: [""],

  dbUnitsConversionMethod: [""],
  dbUnitsConversionDivider: [-1],
  dbUnitsConversionFractionDigits: [0],
  dbUnitsConversionPrefix: [""],
  dbUnitsConversionBase: [""],
  dbUnitsConversionLabelMode: [""],

  // unset means "render whatever the agent reported"; only an explicit choice converts
  temperature: undefined,
  secondsAsTime: true,
  heatmapBucketUnit: null,
  heatmapCellGap: 0,
  heatmapKeepEmptyRows: false,
  heatmapPalette: null,
  heatmapColorScale: "linear",
  heatmapCellClick: false,
  heatmapMarkedCell: null,
  heatmapHoverCell: false,
  heatmapHoverColor: null,
  heatmapTooltipHideZeros: false,
  heatmapTooltipTopFirst: false,
  heatmapTooltipValueOnly: false,
  heatmapLegend: "full",
  timezone: undefined,
  locale: undefined,
  syncTimezone: true,

  dimensionsSort: "default", // default | nameAsc | nameDesc | valueAsc | valueDesc

  autofetch: false,
  autofetchOnWindowBlur: false,
  paused: false,
  pixelsPerPoint: 3,
  points: null,
  legend: true,
  chartLegendLayout: null,
  groupingMethod: "average",
  groupingTime: 0,
  urlOptions: [],
  eliminateZeroDimensions: true,
  fullscreen: false,
  overlays: {},

  showingInfo: false,
  colors: [],

  height: "",
  enabledYAxis: true,

  width: "",
  enabledXAxis: true,
  xAxisTimeStyle: "medium",
  xAxisFitLastLabel: false,
  barFillStyle: "solid",
  barGlowDimensionIds: [],
  valueFocus: null,
  valueFocusDefault: null,

  hasToolbox: true,
  hideTitle: false,
  hideName: false,
  hideUnits: null,
  hasHoverPopover: true,
  expandable: true,
  showAnnotations: true,

  yAxisLabelWidth: 68,
  axisLabelFontSize: 10,

  outOfLimits: false,
  aggregationMethod: "sum",
  postAggregationMethod: "avg",

  groupBy: ["dimension"],
  groupByLabel: [],
  postGroupBy: ["selected"],
  postGroupByLabel: [],

  dimensionsSortBy: [{ id: "contribution", desc: true }],
  instancesSortBy: [{ id: "contribution", desc: true }],
  nodesSortBy: [{ id: "contribution", desc: true }],
  groupBySortBy: [],
  labelsSortBy: [{ id: "contribution", desc: true }],

  nodesExpanded: {},
  groupByExpanded: {},
  labelsExpanded: {},

  drilldown: {
    groupBy: ["node", "instance", "dimension"],
    groupByLabel: [],
    data: null,
    loading: false,
    error: null,
    sortBy: [],
    expanded: {},
    search: "",
    groupBySortBy: [],
    groupByExpanded: {},
  },

  correlate: {
    data: null,
    loading: false,
    error: null,
    method: "volume",
    aggregation: "average",
    dataType: "",
    threshold: 0.01,
    expanded: {},
    search: "",
  },

  pristine: {},

  themeGridColor: themeColors("borderSecondary"),
  themeCrosshair: themeColors("highlight"),
  themeHighlightColor: themeColors("highlight"),
  themeSelectionColor: themeColors("highlight"),
  themeDraftAnnotationColor: themeColors("textLite"),
  themeActiveBoxColor: themeColors("controlFocused"),
  themeHeatmapMarkedCell: themeColors("warning"),

  themeTrackColor: themeColors("progressBg"),
  themeScaleColor: themeColors("border"),

  themeEasyPieTrackColor: themeColors("progressBg"),
  themeEasyPieScaleColor: themeColors("border"),

  themeGaugePointer: themeColors("textLite"),
  themeGaugeStroke: themeColors("progressBg"),

  gaugeLineWidth: 0.1,
  gaugeGradient: true,
  gaugeThresholds: null,

  themeD3pieSmallColor: themeColors("placeholder"),
  themeD3pieStroke: themeColors("cardBackground"),
  themeInnerLabelColor: themeColors("actionContrastText"),

  themeLabelColor: themeColors("text"),
  themeAxisLabelColor: themeColors("textLite"),
  themeBackground: themeColors("cardBackground"),
  themeNeutralBackground: themeColors("progressBg"),
  themeSkeleton: themeColors("progressBg"),
  themeSkeletonGrid: themeColors("borderSecondary"),
  themeSkeletonSpark: themeColors("bright"),
  themeWarningBackground: ["#FFCC26", "#FFCC26"],
  themeErrorBackground: ["#F95251", "#F95251"],

  themeAnomalyScaleColor: ["#9F75F9", "#9F75F9"],
  themeAnomalyRampLow: ["#D6CAFF", "#4A3A8C"],
  themeAnomalyRampHigh: ["#6234D6", "#C4A0FF"],
  themeAnomalySpotlightDim: themeColors("cardBackground").map(color => withAlpha(color, 0.55)),

  themeAlertWarning: ["#C98A00", "#E0A526"],
  themeAlertCritical: ["#D63F3F", "#E5484D"],
  themeAlertClear: ["#00914A", "#1FA35E"],

  themeGroupBoxesMin: ["#E4F1FF", "#000C18"],
  themeGroupBoxesMax: ["#0075F2", "#0075F2"],
  themeGroupBoxesScale: [
    ["#EAF1FC", "#C9DCF7", "#9CC0F0", "#6A9EE6", "#3D7AD6", "#2358B0", "#173E80"],
    ["#172230", "#1B3350", "#224B78", "#2C66A3", "#3F84D4", "#6FA6EE", "#A9CBF8"],
  ],
  groupBoxesThreshold: null,
  groupBoxesFocus: [],
  groupBoxesPinned: null,

  themeLoadingStart: ["#BFE5C6", "#2f5446"],
  themeNetdata: ["#00AB44", "#00AB44"],

  themeShadow: themeColors("dropdownShadow"),

  designFlavour: "default",

  legendScroll: 0,

  initializedFilters: false,
  error: null,

  agent: true,

  toolboxElements: [Settings, Fullscreen],
  toolboxProps: {},
  settingsTabs: [DisplayTab, DataTab, InfoTab, DownloadTab],
  nulls2zero: false,
  filterToolboxMode: "fixed",
  leftHeaderElements: [Status],

  expanded: false,
  expandedHeight: 300,

  viewDimensions: {
    ids: [],
    names: [],
    count: 0,
    priorities: [],
    grouped: [],
    algorithm: "absolute", // absolute|incremental
  },

  // view
  units: [""],
  unitsStsByContext: {},
  unitsByContext: {},
  unitsByDimension: {},
  viewUpdateEvery: 0, // view.update_every

  // db
  dbUnits: [""],
  dbUnitsStsByContext: {},
  dbUnitsByContext: {},
  dbUnitsByDimension: {},
  updateEvery: 0,
  firstEntry: 0,
  lastEntry: 0,

  // summary
  dimensions: {},
  labels: {},
  nodes: {},
  instances: {},
  alerts: {},

  drawer: {
    action: "compare",
    tab: "window",
    showAdvancedStats: false,
    valuesSearch: "",
  },

  renderedAt: null,
  fetchAt: null,
  liveAnchor: null,

  dimensionsOnNonDimensionGrouping: null,

  en: {
    instance: {
      one: "instance",
      other: "instances",
    },
  },

  tableColumns: ["context", "dimension"],

  bearer: null,
  xNetdataBearer: null,

  showPostAggregations: false,

  showAnomalies: true,

  canCreateAnnotations: true,
  enabledAnnotations: true,
  highlightOpacity: 1,
  draftAnnotation: null, // { timestamp, createdAt, status: "draft"|"editing"|"saving" }

  comparePeriods: [],
  compareLoading: false,
  compareError: null,
  customPeriods: [
    {
      id: "24h",
      label: "24 hours before",
      offsetSeconds: 86400,
    },
    {
      id: "7d",
      label: "7 days before",
      offsetSeconds: 604800,
    },
  ],

  selectedNodeLabelsFilter: [],
}
