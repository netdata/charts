/* eslint-disable no-unused-vars */
import uPlot from "uplot"
import makeChartUI from "@/sdk/makeChartUI"

export default (sdk, chart) => {
  const chartUI = makeChartUI(sdk, chart)
  let uplot = null

  const mount = element => {
    if (uplot) return

    chartUI.mount(element)

    const theme = chart.getAttribute("theme")
    element.classList.add(theme)

    const { loaded } = chart.getAttributes()

    const randomNormals = rng => {
      let u1 = 0,
        u2 = 0
      //Convert [0,1) to (0,1)
      while (u1 === 0) u1 = rng()
      while (u2 === 0) u2 = rng()
      const R = Math.sqrt(-2.0 * Math.log(u1))
      const Θ = 2.0 * Math.PI * u2
      return [R * Math.cos(Θ), R * Math.sin(Θ)]
    }

    const randomSkewNormal = (rng, ξ, ω, a = 0) => {
      const [u0, v] = randomNormals(rng)
      if (a === 0) {
        return ξ + ω * u0
      }
      const b = a / Math.sqrt(1 + a * a)
      const u1 = b * u0 + Math.sqrt(1 - b * b) * v
      const z = u0 >= 0 ? u1 : -u1
      return ξ + ω * z
    }

    const rawData = (xCount, ySeriesCount, yCountMin, yCountMax, yMin, yMax) => {
      xCount = xCount || 100
      ySeriesCount = ySeriesCount || 1

      // 50-300 samples per x
      yCountMin = yCountMin || 200
      yCountMax = yCountMax || 500

      // y values in 0 - 1000 range
      yMin = yMin || 5
      yMax = yMax || 1000

      let data = [
        [],
        ...Array(ySeriesCount)
          .fill(null)
          .map(_ => []),
      ]

      let now = Math.round(new Date() / 1e3)

      let finalCount = 0

      for (let xi = 0; xi < xCount; xi++) {
        data[0][xi] = now++

        for (let si = 1; si <= ySeriesCount; si++) {
          let yCount = Math.floor(Math.random() * (yCountMax - yCountMin + 1) + yCountMin)

          let vals = (data[si][xi] = [])

          while (yCount-- > 0) {
            //	vals.push(Math.round(randn_bm(yMin, yMax, 3)));
            vals.push(Math.max(randomSkewNormal(Math.random, 30, 30, 3), yMin))
            finalCount++
          }

          vals.sort((a, b) => a - b)
        }
      }

      return data
    }

    let raw = rawData()

    let data = [
      raw[0],
      raw[1].map(vals => vals[0]),
      raw[1].map(vals => vals[vals.length - 1]),
      raw[1],
    ]

    const heatmapPlugin = () => {
      return {
        hooks: {
          draw: u => {
            const { ctx, data } = u

            let yData = data[3]

            ctx.save()
            ctx.beginPath()
            ctx.rect(u.bbox.left, u.bbox.top, u.bbox.width, u.bbox.height)
            ctx.clip()

            yData.forEach((yVals, xi) => {
              let xPos = Math.round(u.valToPos(data[0][xi], "x", true))

              yVals.forEach(yVal => {
                let yPos = Math.round(u.valToPos(yVal, "y", true))
                ctx.fillStyle = "green"
                ctx.fillRect(xPos - 4, yPos, 10, 1)
              })
            })

            ctx.restore()
          },
        },
      }
    }

    const opts = {
      width: 1800,
      height: 500,
      title: "Latency Heatmap (~35k)",
      plugins: [heatmapPlugin()],
      cursor: {
        drag: {
          y: true,
        },
        points: {
          show: false,
        },
      },
      series: [
        {},
        {
          paths: () => null,
          points: { show: false },
        },
        {
          paths: () => null,
          points: { show: false },
        },
      ],
    }

    uplot = new uPlot(opts, data, element)

    render()
  }

  const render = () => {
    chartUI.render()

    chart.consumePayload()

    chartUI.trigger("rendered")
  }

  const getUplot = () => uplot

  const unmount = () => {
    if (!uplot) return
    chartUI.unmount()
    uplot = null
  }

  const instance = {
    ...chartUI,
    getUplot,
    mount,
    unmount,
    render,
  }

  return instance
}
