import { makeD3PieFrame } from "."

const makePie = () => {
  const element = document.createElement("div")
  element.innerHTML = '<svg><path data-index="0"/><path data-index="1"/></svg>'
  return {
    element,
    innerRadius: 90,
    outerRadius: 180,
    pieCenter: { x: 250, y: 200 },
    options: {
      colors: ["#3366cc", "#ff9900"],
      data: { content: [{ value: 25 }, { value: 75 }] },
      effects: { highlightLuminosity: -0.2 },
      misc: { colors: { segmentStroke: "#dbe1e1" } },
    },
  }
}

describe("GPU D3 Pie visualization", () => {
  it("preserves donut geometry and cumulative clockwise wedges", () => {
    const frame = makeD3PieFrame(
      makePie(),
      { width: 500, height: 400, dpr: 2 },
      -1
    )

    expect(frame.centerX).toBe(500)
    expect(frame.centerY).toBe(400)
    expect(frame.innerRadius).toBe(180)
    expect(frame.outerRadius).toBe(360)
    expect(frame.strokeWidth).toBe(2)
    expect(frame.segments[0].startAngle).toBe(0)
    expect(frame.segments[0].endAngle).toBeCloseTo(Math.PI / 2)
    expect(frame.segments[1].startAngle).toBeCloseTo(Math.PI / 2)
    expect(frame.segments[1].endAngle).toBeCloseTo(Math.PI * 2)
  })

  it("uses the exact legacy hover luminosity", () => {
    const frame = makeD3PieFrame(
      makePie(),
      { width: 500, height: 400, dpr: 1 },
      0
    )

    expect(frame.segments[0].color).toEqual([
      41 / 255,
      82 / 255,
      163 / 255,
      1,
    ])
    expect(frame.segments[1].color).toEqual([1, 0.6, 0, 1])
  })
})
