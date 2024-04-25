export default (chartUI, dataOptions = {}) => {
  const { clientWidth, clientHeight } = chartUI.getElement()

  return {
    header: {
      title: {
        text: "",
        color: "",
        fontSize: "",
        fontWeight: "",
      },
      subtitle: {
        text: "",
        color: "",
        fontSize: "",
        fontWeight: "",
      },
      titleSubtitlePadding: 1,
    },
    footer: {
      text: "",
      color: "",
      fontSize: "",
      fontWeight: "",
      location: "",
    },
    data: {
      // none, random, value-asc, value-desc, label-asc, label-desc
      sortOrder: "label-asc",
      smallSegmentGrouping: {
        enabled: true,
        value: 5,
        // percentage, value
        valueType: "count",
        label: "smaller",
        caption: "rest of dimensions",
        color: chartUI.chart.getThemeAttribute("themeD3pieSmallColor"),
      },
      content: [],
      ...dataOptions,
    },
    labels: {
      outer: {
        // label, value, percentage, label-value1, label-value2, label-percentage1,
        // label-percentage2
        format: "label-value2",
        hideWhenLessThanPercentage: null,
        pieDistance: 10,
      },
      inner: {
        // label, value, percentage, label-value1, label-value2, label-percentage1,
        // label-percentage2
        format: "percentage",
        hideWhenLessThanPercentage: 101,
      },
      mainLabel: {
        color: "segment", // or 'segment' for dynamic color
        fontSize: "0.9em",
        fontWeight: "normal",
        font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Ubuntu, "Helvetica Neue", sans-serif',
      },
      percentage: {
        color: chartUI.chart.getThemeAttribute("themeInnerLabelColor"),
        fontSize: "1em",
        fontWeight: "strong",
        decimalPlaces: 0,
        font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Ubuntu, "Helvetica Neue", sans-serif',
      },
      value: {
        color: chartUI.chart.getThemeAttribute("themeD3pieSmallColor"),
        fontSize: "1.2em",
        fontWeight: "strong",
        font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Ubuntu, "Helvetica Neue", sans-serif',
      },
      lines: {
        enabled: true,
        style: "curved",
        color: "segment",
      },
      truncation: {
        enabled: false,
        truncateLength: 30,
      },
      formatter(context) {
        if (context.part === "value")
          return `${
            context.realLabel === "No data"
              ? "-"
              : chartUI.chart.getConvertedValue(context.value, { dimensionId: context.id })
          } ${chartUI.chart.getUnitSign({ dimensionId: context.id })}`
        if (context.part === "percentage") return `${context.label}%`

        return context.label
      },
    },
    effects: {
      load: {
        effect: "none", // none / default
        speed: 0, // commented in the d3pie code to speed it up
      },
      pullOutSegmentOnClick: {
        effect: "bounce", // none / linear / bounce / elastic / back
        speed: 400,
        size: 5,
      },
      highlightSegmentOnMouseover: true,
      highlightLuminosity: -0.2,
    },
    tooltips: {
      enabled: false,
      type: "caption", // caption|placeholder
      string: "",
      placeholderParser: null, // function
      styles: {
        fadeInSpeed: 250,
        backgroundColor: "#000000",
        backgroundOpacity: 0.5,
        color: "#ffffff",
        borderRadius: 2,
        fontSize: "11px",
        padding: 4,
      },
    },
    misc: {
      colors: {
        background: "transparent", // transparent or color #
        segments: [],
        segmentStroke: chartUI.chart.getThemeAttribute("themeD3pieStroke"),
      },
      gradient: {
        enabled: false,
      },
      canvasPadding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
      pieCenterOffset: {
        x: 0,
        y: 0,
      },
      cssPrefix: null,
    },
    callbacks: {
      onload: null,
      onMouseoverSegment: null,
      onMouseoutSegment: null,
      onClickSegment: null,
    },
    size: {
      canvasHeight: Math.floor(clientHeight),
      canvasWidth: Math.floor(clientWidth),
      pieInnerRadius: "50%",
      pieOuterRadius: "75%",
    },
  }
}
