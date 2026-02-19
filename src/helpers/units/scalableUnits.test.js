import scalableUnits, { keys } from "./scalableUnits"

describe("scalableUnits", () => {
  describe("keys export", () => {
    it("contains binary scale keys", () => {
      expect(keys.binary).toEqual(["1", "Ki", "Mi", "Gi", "Ti"])
    })

    it("contains bit scale keys", () => {
      expect(keys.bit).toEqual(["1", "k", "M", "G", "T", "P", "E", "Z", "Y"])
    })

    it("contains decimal scale keys", () => {
      expect(keys.decimal).toEqual(["1", "K", "M", "B", "T"])
    })

    it("contains num scale keys", () => {
      expect(keys.num).toEqual([
        "y",
        "z",
        "a",
        "f",
        "p",
        "n",
        "u",
        "m",
        "1",
        "k",
        "M",
        "G",
        "T",
        "P",
        "E",
        "Z",
        "Y",
      ])
    })
  })

  describe("binary scales", () => {
    it("contains correct binary multipliers", () => {
      expect(scalableUnits.binary.Ki).toBe(1024)
      expect(scalableUnits.binary.Mi).toBe(1048576)
      expect(scalableUnits.binary.Gi).toBe(1073741824)
      expect(scalableUnits.binary.Ti).toBe(1099511627776)
    })

    it("uses powers of 1024", () => {
      expect(scalableUnits.binary.Ki).toBe(Math.pow(1024, 1))
      expect(scalableUnits.binary.Mi).toBe(Math.pow(1024, 2))
      expect(scalableUnits.binary.Gi).toBe(Math.pow(1024, 3))
      expect(scalableUnits.binary.Ti).toBe(Math.pow(1024, 4))
    })
  })

  describe("decimal scales", () => {
    it("contains correct decimal multipliers", () => {
      expect(scalableUnits.decimal.K).toBe(1000)
      expect(scalableUnits.decimal.M).toBe(1000000)
      expect(scalableUnits.decimal.B).toBe(1000000000)
      expect(scalableUnits.decimal.T).toBe(1000000000000)
    })

    it("uses powers of 1000", () => {
      expect(scalableUnits.decimal.K).toBe(Math.pow(1000, 1))
      expect(scalableUnits.decimal.M).toBe(Math.pow(1000, 2))
      expect(scalableUnits.decimal.B).toBe(Math.pow(1000, 3))
      expect(scalableUnits.decimal.T).toBe(Math.pow(1000, 4))
    })
  })

  describe("num scales", () => {
    it("contains scientific notation multipliers", () => {
      expect(scalableUnits.num.y).toBe(0.000000000000000000000001) // yocto
      expect(scalableUnits.num.z).toBe(0.000000000000000000001) // zepto
      expect(scalableUnits.num.a).toBe(0.000000000000000001) // atto
      expect(scalableUnits.num.f).toBe(0.000000000000001) // femto
      expect(scalableUnits.num.p).toBe(0.000000000001) // pico
      expect(scalableUnits.num.n).toBe(0.000000001) // nano
      expect(scalableUnits.num.u).toBe(0.000001) // micro
      expect(scalableUnits.num.m).toBe(0.001) // milli
    })

    it("contains large scale multipliers", () => {
      expect(scalableUnits.num.k).toBe(1000) // kilo
      expect(scalableUnits.num.M).toBe(1000000) // mega
      expect(scalableUnits.num.G).toBe(1000000000) // giga
      expect(scalableUnits.num.T).toBe(1000000000000) // tera
      expect(scalableUnits.num.P).toBe(1000000000000000) // peta
      expect(scalableUnits.num.E).toBe(1e18) // exa
      expect(scalableUnits.num.Z).toBe(1e21) // zetta
      expect(scalableUnits.num.Y).toBe(1e24) // yotta
    })

    it("uses correct scientific notation for very large numbers", () => {
      expect(scalableUnits.num.E).toBe(1e18)
      expect(scalableUnits.num.Z).toBe(1e21)
      expect(scalableUnits.num.Y).toBe(1e24)
    })

    it("uses correct scientific notation for very small numbers", () => {
      expect(scalableUnits.num.y).toBe(1e-24)
      expect(scalableUnits.num.z).toBe(1e-21)
      expect(scalableUnits.num.a).toBe(1e-18)
      expect(scalableUnits.num.f).toBe(1e-15)
      expect(scalableUnits.num.p).toBe(1e-12)
      expect(scalableUnits.num.n).toBe(1e-9)
      expect(scalableUnits.num.u).toBe(1e-6)
      expect(scalableUnits.num.m).toBe(1e-3)
    })
  })

  describe("structure validation", () => {
    it("exports object with expected structure", () => {
      expect(scalableUnits).toHaveProperty("binary")
      expect(scalableUnits).toHaveProperty("decimal")
      expect(scalableUnits).toHaveProperty("num")
    })

    it("contains only expected scale types", () => {
      const expectedKeys = ["binary", "decimal", "chronos", "num"]
      expect(Object.keys(scalableUnits)).toEqual(expectedKeys)
    })

    it("all scale values are numbers", () => {
      Object.values(scalableUnits).forEach(scaleGroup => {
        Object.values(scaleGroup).forEach(value => {
          expect(typeof value).toBe("number")
          expect(Number.isFinite(value)).toBe(true)
        })
      })
    })

    it("all scale values are positive", () => {
      Object.values(scalableUnits).forEach(scaleGroup => {
        Object.values(scaleGroup).forEach(value => {
          expect(value).toBeGreaterThan(0)
        })
      })
    })
  })

  describe("mathematical relationships", () => {
    it("binary scales follow 1024 progression", () => {
      const binary = scalableUnits.binary
      expect(binary.Mi / binary.Ki).toBe(1024)
      expect(binary.Gi / binary.Mi).toBe(1024)
      expect(binary.Ti / binary.Gi).toBe(1024)
    })

    it("decimal scales follow 1000 progression", () => {
      const decimal = scalableUnits.decimal
      expect(decimal.M / decimal.K).toBe(1000)
      expect(decimal.B / decimal.M).toBe(1000)
      expect(decimal.T / decimal.B).toBe(1000)
    })

    it("num scales follow 1000 progression for positive powers", () => {
      const num = scalableUnits.num
      expect(num.M / num.k).toBe(1000)
      expect(num.G / num.M).toBe(1000)
      expect(num.T / num.G).toBe(1000)
      expect(num.P / num.T).toBe(1000)
    })

    it("num scales follow 1000 division for negative powers", () => {
      const num = scalableUnits.num
      expect(num.m / num.u).toBeCloseTo(1000, 6)
      expect(num.u / num.n).toBeCloseTo(1000, 6)
      expect(num.n / num.p).toBeCloseTo(1000, 6)
      expect(num.p / num.f).toBeCloseTo(1000, 6)
    })
  })
})
