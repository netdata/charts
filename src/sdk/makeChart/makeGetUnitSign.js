import unitsJson from "@/units.json"

const getUnit = u =>
  typeof unitsJson.units[u] !== "undefined" ? unitsJson.units[u] : { print_symbol: u, name: u }

const numRegex = /num\s\(([fpnμmcAhkMGTPE])\)?\s(.+)?/

export default chart =>
  (chart.getUnitSign = ({ long = false, key = "units", withoutConversion = false } = {}) => {
    if (withoutConversion) return chart.getAttribute("units")

    let units = withoutConversion ? chart.getAttribute(key) : chart.getAttribute(`${key}Conversion`)

    let prefix = ""

    if (numRegex.test(units)) {
      const customMatch = units.match(numRegex)

      prefix = customMatch[1] && customMatch[1] !== "A" ? `${customMatch[1]} ` : ""
      units = customMatch[2]
    }

    if (!units || units === "undefined" || units === "null") return ""

    const unitNames = getUnit(units)
    return `${prefix}${long ? unitNames.name : unitNames.print_symbol || units}`
  })
