import ChartType from "@/components/toolbox/chartType"
import Fullscreen from "@/components/toolbox/fullscreen"
import Information from "@/components/toolbox/information"
import Download from "@/components/toolbox/download"
import Settings from "@/components/toolbox/settings"

import Status from "@/components/status"

export default {
  id: "",
  name: "",
  chartLibrary: "",
  theme: "default",
  host: "",
  description: null,
  before: 0,
  after: 0,
  title: null,
  min: 0,
  max: 0,
  autofetchOnHovering: false,

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

  dbUnitsConversionMethod: [""],
  dbUnitsConversionDivider: [-1],
  dbUnitsConversionFractionDigits: [0],
  dbUnitsConversionPrefix: [""],
  dbUnitsConversionBase: [""],

  temperature: "celsius",
  secondsAsTime: true,
  timezone: undefined,
  syncTimezone: true,

  dimensionsSort: "default", // default | nameAsc | nameDesc | valueAsc | valueDesc

  autofetch: false,
  autofetchOnWindowBlur: false,
  paused: false,
  pixelsPerPoint: 3,
  points: null,
  legend: true,
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

  hasToolbox: true,
  hasHoverPopover: true,
  expandable: true,
  showAnnotations: true,

  hasYlabel: true,
  yAxisLabelWidth: 60,
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
    groupBySortBy: [],
    groupByExpanded: {},
  },

  pristine: {},

  themeGridColor: ["#E4E8E8", "#212727"],
  themeCrosshair: ["#536775", "#536775"],

  themeTrackColor: ["#DBE1E1", "#353F3F"],
  themeScaleColor: ["#F7F8F8", "#2B3136"],

  themeEasyPieTrackColor: ["#DBE1E1", "#353F3F"],
  themeEasyPieScaleColor: ["#B7C2C2", "#424E4E"],

  themeGaugePointer: ["#8F9EAA", "#536775"],
  themeGaugeStroke: ["#DBE1E1", "#353F3F"],

  themeD3pieSmallColor: ["#536775", "#CFD5DA"],
  themeD3pieStroke: ["#DBE1E1", "#353F3F"],
  themeInnerLabelColor: ["#F7F8F8", "#282827"],

  themeLabelColor: ["#35414a", "#ffffff"],
  themeBackground: ["#ffffff", "#282C34"],
  themeNeutralBackground: ["#DBE1E1", "#353F3F"],
  themeWarningBackground: ["#FFCC26", "#FFCC26"],
  themeErrorBackground: ["#F95251", "#F95251"],

  themeAnomalyScaleColor: ["#9F75F9", "#9F75F9"],

  themeGroupBoxesMin: ["#E4F1FF", "#000C18"],
  themeGroupBoxesMax: ["#0075F2", "#0075F2"],

  themeLoadingStart: ["#BFE5C6", "#2f5446"],
  themeNetdata: ["#00AB44", "#00AB44"],

  themeShadow: ["rgba(9, 30, 66, 0.15)", "rgba(0, 0, 0, 0.4)"],

  designFlavour: "default",

  legendScroll: 0,

  initializedFilters: false,
  error: null,

  agent: true,

  toolboxElements: [Settings, Information, ChartType, Fullscreen, Download],
  toolboxProps: {},
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
  viewUpdateEvery: 0, // view.update_every

  // db
  dbUnits: [""],
  dbUnitsStsByContext: {},
  dbUnitsByContext: {},
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
    action: "values",
    tab: "window",
    showAdvancedStats: false,
  },

  renderedAt: null,
  fetchAt: null,

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

  draftAnnotation: null, // { timestamp, createdAt, status: "draft"|"editing"|"saving" }

  compareData: {},
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
