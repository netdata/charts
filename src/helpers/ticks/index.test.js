import { isDurationAxis, makeAxisTicks } from "."

const values = ticks => ticks.map(tick => tick.v)

describe("axis tick planner", () => {
  it("identifies duration axes only when all units are duration units", () => {
    expect(isDurationAxis({ secondsAsTime: true, units: ["s"] })).toBe(true)
    expect(isDurationAxis({ secondsAsTime: true, units: ["s", "s"] })).toBe(true)
    expect(isDurationAxis({ secondsAsTime: true, units: ["h"] })).toBe(true)
    expect(isDurationAxis({ secondsAsTime: true, units: ["d"] })).toBe(true)
    expect(isDurationAxis({ secondsAsTime: true, units: ["s", "ms"] })).toBe(false)
    expect(isDurationAxis({ secondsAsTime: false, units: ["s"] })).toBe(false)
    expect(isDurationAxis({ secondsAsTime: true, units: ["s", "By"] })).toBe(false)
  })

  it("uses decimal-friendly numeric ticks by default", () => {
    expect(
      values(
        makeAxisTicks({
          min: 0,
          max: 100,
          pixels: 400,
          pixelsPerTick: 50,
          units: ["%"],
        })
      )
    ).toEqual([0, 20, 40, 60, 80, 100])
  })

  it("uses binary-friendly ticks for binary units", () => {
    expect(
      values(
        makeAxisTicks({
          min: 0,
          max: 1024,
          pixels: 400,
          pixelsPerTick: 50,
          units: ["By"],
        })
      )
    ).toEqual([0, 128, 256, 384, 512, 640, 768, 896, 1024])
  })

  it("uses nanosecond-aligned duration ticks for tiny second ranges", () => {
    expect(
      values(
        makeAxisTicks({
          min: 0,
          max: 45e-9,
          pixels: 300,
          pixelsPerTick: 15,
          units: ["s"],
          secondsAsTime: true,
        })
      )
    ).toEqual([0, 1e-8, 2e-8, 3e-8, 4e-8, 5e-8])
  })

  it("uses minute-aligned ticks for hour-scale duration axes", () => {
    expect(
      values(
        makeAxisTicks({
          min: 0,
          max: 35000,
          pixels: 300,
          pixelsPerTick: 15,
          units: ["s"],
          secondsAsTime: true,
        })
      )
    ).toEqual([0, 5400, 10800, 16200, 21600, 27000, 32400, 37800])
  })

  it("uses millisecond-unit duration ticks when source values are milliseconds", () => {
    expect(
      values(
        makeAxisTicks({
          min: 0,
          max: 3500000,
          pixels: 300,
          pixelsPerTick: 15,
          units: ["ms"],
          secondsAsTime: true,
        })
      )
    ).toEqual([0, 600000, 1200000, 1800000, 2400000, 3000000, 3600000])
  })

  it("uses duration ticks when source values are hours", () => {
    expect(
      values(
        makeAxisTicks({
          min: 0,
          max: 26,
          pixels: 300,
          pixelsPerTick: 15,
          units: ["h"],
          secondsAsTime: true,
        })
      )
    ).toEqual([0, 4, 8, 12, 16, 20, 24, 28])
  })

  it("uses year-aligned ticks for year-scale duration axes", () => {
    expect(
      values(
        makeAxisTicks({
          min: 0,
          max: 1.8 * 365 * 86400,
          pixels: 300,
          pixelsPerTick: 15,
          units: ["s"],
          secondsAsTime: true,
        })
      )
    ).toEqual([0, 31536000, 63072000])
  })

  it("falls back to numeric ticks when duration formatting is disabled", () => {
    expect(
      values(
        makeAxisTicks({
          min: 0,
          max: 35000,
          pixels: 300,
          pixelsPerTick: 15,
          units: ["s"],
          secondsAsTime: false,
        })
      )
    ).toEqual([
      0,
      2000,
      4000,
      6000,
      8000,
      10000,
      12000,
      14000,
      16000,
      18000,
      20000,
      22000,
      24000,
      26000,
      28000,
      30000,
      32000,
      34000,
      36000,
    ])
  })

  it("falls back to numeric ticks for mixed-unit axes", () => {
    expect(
      values(
        makeAxisTicks({
          min: 0,
          max: 35000,
          pixels: 300,
          pixelsPerTick: 15,
          units: ["s", "By"],
          secondsAsTime: true,
        })
      )
    ).toEqual([
      0,
      2000,
      4000,
      6000,
      8000,
      10000,
      12000,
      14000,
      16000,
      18000,
      20000,
      22000,
      24000,
      26000,
      28000,
      30000,
      32000,
      34000,
      36000,
    ])
  })
})
