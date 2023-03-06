export default (dygraph, chartUI) => {
  const { annotations } = chartUI.chart.getPayload()

  if (!annotations?.length) return

  const dimensionIds = chartUI.chart.getPayloadDimensionIds()
  const anns = annotations.reduce(
    (h, { t, d, x }) => [
      ...h,
      ...(Array.isArray(x)
        ? [
            {
              series: chartUI.chart.getDimensionName(dimensionIds[d]),
              x: x?.[0] || x,
              shortText: t,
              text: `after:${t}`,
              attachAtBottom: true,
              tickHeight: 0,
              height: 10,
            },
            {
              series: chartUI.chart.getDimensionName(dimensionIds[d]),
              x: x?.[1] || x,
              shortText: t,
              text: `before:${t}`,
              attachAtBottom: true,
              tickHeight: 0,
              height: 10,
            },
          ]
        : [
            {
              series: chartUI.chart.getDimensionName(dimensionIds[d]),
              x: x,
              shortText: t,
              text: t,
              attachAtBottom: true,
              tickHeight: 0,
              height: 10,
            },
          ]),
    ],
    []
  )

  dygraph.setAnnotations(anns)
}
