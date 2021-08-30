import React, { useEffect } from "react"
import { useChart } from "@/components/provider"

const mount = window.requestIdleCallback || window.requestAnimationFrame
const unmount = window.cancelIdleCallback || window.cancelAnimationFrame

export default Component => {
  const DifferedMount = ({ ...rest }) => {
    const chart = useChart()

    useEffect(() => {
      const id = mount(chart.activate)

      return () => {
        unmount(id)
        chart.deactivate()
      }
    }, [chart])

    return <Component {...rest} />
  }

  return DifferedMount
}
