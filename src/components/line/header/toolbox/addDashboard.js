import React, { memo } from "react"
import dashboardAdd from "@netdata/netdata-ui/lib/components/icon/assets/dashboard_add_chart.svg"
import Icon, { Button } from "@/components/icon"
import { useChart } from "@/components/provider"

const AddDashboard = props => {
  const chart = useChart()

  return (
    <Button
      icon={<Icon svg={dashboardAdd} />}
      onClick={() => chart.sdk.trigger("addDashboard", chart)}
      title="Add to dashboard"
      data-testid="chartHeaderToolbox-addDashboard"
      {...props}
    />
  )
}

export default memo(AddDashboard)
