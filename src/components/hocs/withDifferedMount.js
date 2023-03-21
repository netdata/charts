import React, { forwardRef, useLayoutEffect } from "react"
import { useChart } from "@/components/provider"

const mount = window.requestIdleCallback || window.requestAnimationFrame
const unmount = window.cancelIdleCallback || window.cancelAnimationFrame

export default Component => {
  const DifferedMount = forwardRef(({ isVisible = true, ...rest }, ref) => {
    const chart = useChart()

    useLayoutEffect(() => {
      if (!isVisible) return

      const id = mount(chart.activate)

      return () => {
        unmount(id)
        chart.deactivate()
      }
    }, [isVisible, chart])

    return <Component ref={ref} {...rest} />
  })

  return DifferedMount
}
