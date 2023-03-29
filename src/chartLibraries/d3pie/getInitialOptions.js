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
      sortOrder: "value-desc",
      smallSegmentGrouping: {
        enabled: false,
        value: 1,
        // percentage, value
        valueType: "value",
        label: "other",
        color: chartUI.getThemeAttribute("themeD3pieSmallColor"),
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
        hideWhenLessThanPercentage: 20,
      },
      mainLabel: {
        color: "segment", // or 'segment' for dynamic color
        fontSize: "1em",
        fontWeight: "normal",
        font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Ubuntu, "Helvetica Neue", sans-serif',
      },
      percentage: {
        color: chartUI.getThemeAttribute("themeInnerLabelColor"),
        fontSize: "1em",
        fontWeight: "strong",
        decimalPlaces: 0,
        font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Ubuntu, "Helvetica Neue", sans-serif',
      },
      value: {
        color: chartUI.getThemeAttribute("themeD3pieSmallColor"),
        fontSize: "1.3em",
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
          return `${chartUI.chart.getConvertedValue(context.value)} ${chartUI.chart.getUnitSign()}`
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
      type: "placeholder", // caption|placeholder
      string: "",
      placeholderParser: null, // function
      styles: {
        fadeInSpeed: 250,
        backgroundColor: "#000000",
        backgroundOpacity: 0.5,
        color: "#ffffff",
        borderRadius: 2,
        fontSize: 12,
        padding: 4,
      },
    },
    misc: {
      colors: {
        background: "transparent", // transparent or color #
        segments: [],
        segmentStroke: chartUI.getThemeAttribute("themeD3pieStroke"),
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
      pieInnerRadius: "45%",
      pieOuterRadius: "80%",
    },
  }
}
