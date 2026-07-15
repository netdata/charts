import uPlot from "uplot"
import { distr, SPACE_BETWEEN } from "./distr"
import { Quadtree, pointWithin } from "./quadtree"

export const seriesBarsPlugin = opts => {
  let pxRatio

  const { ignore = [] } = opts

  const radius = opts.radius ?? 0

  const setPxRatio = () => {
    pxRatio = devicePixelRatio || 1
  }

  setPxRatio()

  window.addEventListener("dppxchange", setPxRatio)

  const ori = opts.ori
  const dir = opts.dir
  const stacked = opts.stacked

  const groupWidth = opts.groupWidth ?? 0.9
  const groupDistr = SPACE_BETWEEN

  const barWidth = 1
  const barDistr = SPACE_BETWEEN

  const distrTwo = (groupCount, barCount, barSpread = true, _groupWidth = groupWidth) => {
    const out = Array.from({ length: barCount }, () => ({
      offs: Array(groupCount).fill(0),
      size: Array(groupCount).fill(0),
    }))

    distr(groupCount, _groupWidth, groupDistr, null, (groupIdx, groupOffPct, groupDimPct) => {
      distr(barCount, barWidth, barDistr, null, (barIdx, barOffPct, barDimPct) => {
        out[barIdx].offs[groupIdx] = groupOffPct + (barSpread ? groupDimPct * barOffPct : 0)
        out[barIdx].size[groupIdx] = groupDimPct * (barSpread ? barDimPct : 1)
      })
    })

    return out
  }

  let barsPctLayout
  let barsColors

  const barsBuilder = uPlot.paths.bars({
    radius,
    disp: {
      x0: {
        unit: 2,
        values: (u, seriesIdx) => barsPctLayout[seriesIdx].offs,
      },
      size: {
        unit: 2,
        values: (u, seriesIdx) => barsPctLayout[seriesIdx].size,
      },
      ...opts.disp,
    },
    each: (u, seriesIdx, dataIdx, lft, top, wid, hgt) => {
      lft -= u.bbox.left
      top -= u.bbox.top
      qt.add({ x: lft, y: top, w: wid, h: hgt, sidx: seriesIdx, didx: dataIdx })
    },
  })

  const range = (u, dataMin, dataMax) => {
    const [, max] = uPlot.rangeNum(0, dataMax, 0.05, true)
    return [0, max]
  }

  let qt

  return {
    hooks: {
      init: u => {
        for (const el of u.root.querySelectorAll(".u-cursor-pt")) el.style.borderRadius = "unset"
      },
      drawClear: u => {
        qt = qt || new Quadtree(0, 0, u.bbox.width, u.bbox.height)

        qt.clear()

        u.series.forEach(s => {
          s._paths = null
        })

        barsPctLayout = [null].concat(
          distrTwo(u.data[0].length, u.series.length - 1 - ignore.length, !stacked, groupWidth)
        )

        if (opts.disp?.fill != null) {
          barsColors = [null]

          for (let i = 1; i < u.data.length; i++) {
            barsColors.push({
              fill: opts.disp.fill.values(u, i),
              stroke: opts.disp.stroke.values(u, i),
            })
          }
        }
      },
    },
    opts: (u, opts) => {
      const yScaleOpts = {
        range,
        ori: ori === 0 ? 1 : 0,
      }

      let hRect

      uPlot.assign(opts, {
        select: { show: false },
        cursor: {
          x: false,
          y: false,
          dataIdx: (u, seriesIdx) => {
            if (seriesIdx === 1) {
              hRect = null

              const cx = u.cursor.left * pxRatio
              const cy = u.cursor.top * pxRatio

              qt.get(cx, cy, 1, 1, o => {
                if (pointWithin(cx, cy, o.x, o.y, o.x + o.w, o.y + o.h)) hRect = o
              })
            }

            return hRect && seriesIdx === hRect.sidx ? hRect.didx : null
          },
          points: {
            fill: "rgba(255,255,255, 0.3)",
            bbox: (u, seriesIdx) => {
              const isHovered = hRect && seriesIdx === hRect.sidx

              return {
                left: isHovered ? hRect.x / pxRatio : -10,
                top: isHovered ? hRect.y / pxRatio : -10,
                width: isHovered ? hRect.w / pxRatio : 0,
                height: isHovered ? hRect.h / pxRatio : 0,
              }
            },
          },
        },
        scales: {
          x: {
            time: false,
            distr: 2,
            ori,
            dir,
            range: (u, min, max) => {
              min = 0
              max = Math.max(1, u.data[0].length - 1)

              let pctOffset = 0

              distr(u.data[0].length, groupWidth, groupDistr, 0, (di, lftPct, widPct) => {
                pctOffset = lftPct + widPct / 2
              })

              const rn = max - min

              if (pctOffset === 0.5) min -= rn
              else {
                const upScale = 1 / (1 - pctOffset * 2)
                const offset = (upScale * rn - rn) / 2

                min -= offset
                max += offset
              }

              return [min, max]
            },
          },
          rend: yScaleOpts,
          size: yScaleOpts,
          mem: yScaleOpts,
          inter: yScaleOpts,
          toggle: yScaleOpts,
        },
      })

      if (ori === 1) opts.padding = [0, null, 0, null]

      uPlot.assign(opts.axes[0], {
        splits: u => {
          const _dir = dir * (ori === 0 ? 1 : -1)
          const values = u._data[0].slice()
          return _dir === 1 ? values : values.reverse()
        },
        values: u => u.data[0],
        gap: 15,
        size: ori === 0 ? 40 : 150,
        labelSize: 20,
        grid: { show: false },
        ticks: { show: false },
        side: ori === 0 ? 2 : 3,
      })

      opts.series.forEach((s, i) => {
        if (i > 0 && !ignore.includes(i)) {
          uPlot.assign(s, {
            paths: barsBuilder,
            points: { show: false },
          })
        }
      })
    },
  }
}
