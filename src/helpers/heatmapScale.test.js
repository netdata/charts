import {
  detectHeatmapScale,
  formatHeatmapLabel,
  formatScaledValue,
  isHeatmapBinary,
  isHeatmapNumeric,
  parseHeatmapValue,
  sortHeatmapValues,
} from "./heatmapScale"

describe("heatmapScale", () => {
  describe("parseHeatmapValue", () => {
    it("parses integer and decimal bucket labels", () => {
      expect(parseHeatmapValue("0")).toBe(0)
      expect(parseHeatmapValue("5")).toBe(5)
      expect(parseHeatmapValue("10000")).toBe(10000)
      expect(parseHeatmapValue("0.005")).toBe(0.005)
      expect(parseHeatmapValue("2.5")).toBe(2.5)
      expect(parseHeatmapValue(".5")).toBe(0.5)
      expect(parseHeatmapValue("-0.005")).toBe(-0.005)
      expect(parseHeatmapValue("-1024")).toBe(-1024)
    })

    it("parses prefixed bucket labels", () => {
      expect(parseHeatmapValue("bucket_1")).toBe(1)
      expect(parseHeatmapValue("latency_0.005")).toBe(0.005)
      expect(parseHeatmapValue("bucket_+Inf")).toBe(Infinity)
      expect(parseHeatmapValue("latency_-0.005")).toBe(-0.005)
    })

    it("parses positive infinity variants", () => {
      expect(parseHeatmapValue("+Inf")).toBe(Infinity)
      expect(parseHeatmapValue("+inf")).toBe(Infinity)
      expect(parseHeatmapValue("+INF")).toBe(Infinity)
    })

    it("rejects non-bucket labels", () => {
      const rejected = ["5.", "-Inf", "Inf", "5ms", "5e3", "0x10", "abc", "", null, undefined, " "]

      rejected.forEach(value => expect(parseHeatmapValue(value)).toBeNaN())
    })
  })

  describe("isHeatmapNumeric", () => {
    it("accepts pure numeric and infinity labels", () => {
      expect(isHeatmapNumeric(["0.005", "0.01", "+Inf"])).toBe(true)
      expect(isHeatmapNumeric(["1", "2", "5", "10", "+Inf"])).toBe(true)
      expect(isHeatmapNumeric(["bucket_1", "bucket_2", "bucket_+Inf"])).toBe(true)
      expect(isHeatmapNumeric(["+Inf"])).toBe(true)
      expect(isHeatmapNumeric([])).toBe(true)
    })

    it("rejects mixed non-numeric labels", () => {
      expect(isHeatmapNumeric(["5ms", "1", "+Inf"])).toBe(false)
    })
  })

  describe("isHeatmapBinary", () => {
    it("detects integer powers of two above one", () => {
      expect(isHeatmapBinary(["1024", "2048", "4096", "+Inf"])).toBe(true)
      expect(isHeatmapBinary(["1", "2", "4", "8"])).toBe(true)
      expect(isHeatmapBinary(["0.25", "0.5", "1", "2", "4"])).toBe(true)
    })

    it("rejects non-powers of two and empty candidate sets", () => {
      expect(isHeatmapBinary(["0", "5", "10"])).toBe(false)
      expect(isHeatmapBinary(["1000", "2000"])).toBe(false)
      expect(isHeatmapBinary(["3", "5", "+Inf"])).toBe(false)
      expect(isHeatmapBinary(["0.25", "0.5", "1", "+Inf"])).toBe(false)
    })

    it("handles powers larger than 32-bit integers", () => {
      expect(isHeatmapBinary(["4294967296", "1099511627776"])).toBe(true)
    })
  })

  describe("detectHeatmapScale", () => {
    it("selects binary only for power-of-two bucket sets", () => {
      expect(detectHeatmapScale(["1024", "2048", "+Inf"])).toBe("binary")
    })

    it("selects SI for numeric non-binary bucket sets", () => {
      expect(detectHeatmapScale(["0.005", "0.01", "+Inf"])).toBe("num")
      expect(detectHeatmapScale(["0", "5", "10", "+Inf"])).toBe("num")
    })

    it("returns null for non-numeric or empty bucket sets", () => {
      expect(detectHeatmapScale(["5ms", "1"])).toBe(null)
      expect(detectHeatmapScale([])).toBe(null)
    })
  })

  describe("sortHeatmapValues", () => {
    it("sorts numeric labels with positive infinity last", () => {
      expect(sortHeatmapValues(["5", "1", "10", "+Inf"])).toEqual(["1", "5", "10", "+Inf"])
      expect(sortHeatmapValues(["10", "+Inf", "1", "5"])).toEqual(["1", "5", "10", "+Inf"])
      expect(sortHeatmapValues(["0.25", "0.005", "1", "+Inf"])).toEqual([
        "0.005",
        "0.25",
        "1",
        "+Inf",
      ])
    })

    it("sorts signed bucket boundaries numerically", () => {
      expect(sortHeatmapValues(["1024", "-1", "0", "-1024", "+Inf"])).toEqual([
        "-1024",
        "-1",
        "0",
        "1024",
        "+Inf",
      ])
    })

    it("sorts the live Prometheus bucket shape", () => {
      expect(sortHeatmapValues(["+Inf", "0.3", "10", "120", "15", "2", "2.5"])).toEqual([
        "0.3",
        "2",
        "2.5",
        "10",
        "15",
        "120",
        "+Inf",
      ])
    })

    it("sorts prefixed compatibility labels while preserving original ids", () => {
      expect(sortHeatmapValues(["bucket_+Inf", "bucket_10", "bucket_2"])).toEqual([
        "bucket_2",
        "bucket_10",
        "bucket_+Inf",
      ])
    })

    it("falls back for non-numeric labels and does not mutate input", () => {
      const values = ["10", "1", "+Inf"]
      const sorted = sortHeatmapValues(values)

      expect(sorted).toEqual(["1", "10", "+Inf"])
      expect(sorted).not.toBe(values)
      expect(values).toEqual(["10", "1", "+Inf"])
      expect(sortHeatmapValues(["5ms", "1"])).toBe(null)
    })
  })

  describe("formatScaledValue", () => {
    it("formats SI values compactly", () => {
      expect(formatScaledValue(0.005, "num")).toBe("5m")
      expect(formatScaledValue(0.0001, "num")).toBe("100u")
      expect(formatScaledValue(500, "num")).toBe("500")
      expect(formatScaledValue(1000, "num")).toBe("1k")
      expect(formatScaledValue(1500, "num")).toBe("1.5k")
      expect(formatScaledValue(1250, "num")).toBe("1.25k")
      expect(formatScaledValue(1000000, "num")).toBe("1M")
      expect(formatScaledValue(0, "num")).toBe("0")
      expect(formatScaledValue(-0.005, "num")).toBe("-5m")
      expect(formatScaledValue(-1500, "num")).toBe("-1.5k")
    })

    it("formats binary values compactly", () => {
      expect(formatScaledValue(500, "binary")).toBe("500")
      expect(formatScaledValue(1023, "binary")).toBe("1023")
      expect(formatScaledValue(1024, "binary")).toBe("1Ki")
      expect(formatScaledValue(1536, "binary")).toBe("1.5Ki")
      expect(formatScaledValue(1048576, "binary")).toBe("1Mi")
      expect(formatScaledValue(0, "binary")).toBe("0")
      expect(formatScaledValue(-1536, "binary")).toBe("-1.5Ki")
    })
  })

  describe("formatHeatmapLabel", () => {
    it("keeps infinity literal", () => {
      expect(formatHeatmapLabel("+Inf", "num")).toBe("+Inf")
      expect(formatHeatmapLabel("+Inf", "binary")).toBe("+Inf")
      expect(formatHeatmapLabel("+Inf", null)).toBe("+Inf")
      expect(formatHeatmapLabel("+inf", "num")).toBe("+Inf")
    })

    it("formats numeric labels using the detected scale", () => {
      expect(formatHeatmapLabel("0.005", "num")).toBe("5m")
      expect(formatHeatmapLabel("1024", "binary")).toBe("1Ki")
      expect(formatHeatmapLabel("bucket_1024", "binary")).toBe("1Ki")
      expect(formatHeatmapLabel("bucket_-1024", "binary")).toBe("-1Ki")
    })

    it("passes through fallback labels", () => {
      expect(formatHeatmapLabel("5ms", "num")).toBe("5ms")
      expect(formatHeatmapLabel("0.005", null)).toBe("0.005")
    })
  })
})
