import ChartType from "@/components/toolbox/chartType"
import Fullscreen from "@/components/toolbox/fullscreen"
import Information from "@/components/toolbox/information"

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
  updatedAt: 0,
  fetchStartedAt: 0,
  focused: false,
  active: false,
  sparkline: false,
  chartType: "",
  selectedLegendDimensions: [],

  contextItems: [],
  contextScope: [],
  nodesScope: [],
  selectedContexts: [],
  selectedDimensions: [],
  selectedLabels: [],
  selectedNodes: [],
  selectedInstances: [],

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

  desiredUnits: "auto",
  syncUnits: false,

  unitsConversionMethod: "",
  unitsConversionDivider: -1,
  unitsConversionFractionDigits: 0,
  unitsConversion: "",

  dbUnitsConversionMethod: "",
  dbUnitsConversionDivider: -1,
  dbUnitsConversionFractionDigits: 0,
  dbUnitsConversion: "",

  temperature: "celsius",
  secondsAsTime: true,
  timezone: undefined,
  syncTimezone: true,

  dimensionsSort: "default", // default | nameAsc | nameDesc | valueAsc | valueDesc

  autofetch: false,
  autofetchOnWindowBlur: false,
  paused: false,
  pixelsPerPoint: 1,
  legend: true,
  groupingMethod: "average",
  groupingTime: 0,
  urlOptions: [],
  eliminateZeroDimensions: true,
  fullscreen: false,
  overlays: {},
  themeGridColor: ["#F7F8F8", "#282827"],
  themeCrosshair: ["#536775", "#536775"],
  showingInfo: false,
  colors: [],
  height: "",
  enabledHeightResize: true,
  pristineEnabledHeightResize: {},
  enabledXAxis: true,
  enabledYAxis: true,

  hasToolbox: true,
  expandable: true,

  hasYlabel: true,
  yAxisLabelWidth: null, // default is most probably 50
  axisLabelFontSize: 10,

  outOfLimits: false,
  aggregationMethod: "sum",

  groupBy: ["dimension"],
  groupByLabel: [],

  dimensionsSortBy: [{ id: "contribution", desc: true }],
  instancesSortBy: [{ id: "contribution", desc: true }],
  nodesSortBy: [{ id: "contribution", desc: true }],
  groupBySortBy: [],
  labelsSortBy: [{ id: "contribution", desc: true }],

  nodesExpanded: {},
  groupByExpanded: {},
  labelsExpanded: {},

  pristine: {},

  themeTrackColor: ["#ECEEEF", "#383B40"],
  themeScaleColor: ["#F7F8F8", "#2B3136"],

  themeEasyPieTrackColor: ["#ECEEEF", "#383B40"],
  themeEasyPieScaleColor: ["#CFD5DA", "#536775"],

  themeGaugePointer: ["#8F9EAA", "#536775"],
  themeGaugeStroke: ["#ECEEEF", "#383B40"],

  themeD3pieSmallColor: ["#536775", "#CFD5DA"],
  themeD3pieStroke: ["#ECEEEF", "#383B40"],
  themeInnerLabelColor: ["#F7F8F8", "#282827"],

  themeLabelColor: ["#35414a", "#ffffff"],
  themeNeutralBackground: ["#ECEEEF", "#383B40"],
  themeWarningBackground: ["#FFCC26", "#FFCC26"],
  themeErrorBackground: ["#F95251", "#F95251"],

  themeAnomalyScaleColor: ["#9F75F9", "#9F75F9"],
  themeAnomalyLiteScaleColor: ["#F0EAF6", "#504576"],

  themeGroupBoxesMin: ["#E4F1FF", "#000C18"],
  themeGroupBoxesMax: ["#0075F2", "#0075F2"],

  flex: 1,
  legendScroll: 0,

  initializedFilters: false,
  error: null,

  agent: true,

  toolboxElements: [Information, ChartType, Fullscreen],

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
  units: "",
  viewUpdateEvery: 0, // view.update_every

  // db
  updateEvery: 0,
  firstEntry: 0,
  lastEntry: 0,

  // summary
  dimensions: [],
  labels: [],
  nodes: [],
  instances: [],
  alerts: [],

  weightsAction: "values",
  weightsTab: "window",

  renderedAt: null,
  fetchAt: null,

  dimensionsOnNonDimensionGrouping: null,

  en: {
    instance: {
      one: "instance",
      other: "instances",
    },
  },
}
