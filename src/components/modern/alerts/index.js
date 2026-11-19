import { useAttributeValue } from "@/components/provider"
import { findAlertRow, makeAlertsPanel } from "./panel"
import { describeRoot, toAlertRows } from "./rows"

export { parseExpression, parseThresholds } from "./parseThreshold"
export { thresholdOverlayId } from "./panel"

export const makeAlertsMenu = ({ id = "alerts", order = 100, ...hooks } = {}) => {
  const Panel = makeAlertsPanel(hooks)

  const useItem = ({ path } = {}) => {
    const rows = toAlertRows(useAttributeValue("alerts"))
    const row = findAlertRow(rows, path)

    return {
      label: "Alerts",
      panelLabel: row?.name,
      hint: describeRoot(rows),
      Panel,
      panelWidth: "300px",
      testId: "chartMore-alerts",
    }
  }

  return { id, group: "root", order, statusTarget: true, useItem }
}

export default makeAlertsMenu
