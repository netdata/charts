export const stateUnits = new Set(["state", "{state}", "status", "{status}"])

export const isStateUnits = units => {
  const list = (Array.isArray(units) ? units : [units]).filter(Boolean)
  return list.length > 0 && list.every(unit => stateUnits.has(unit))
}
