import { useRef, useState } from "react"
import { Drop } from "@netdata/netdata-ui"
import { useAttributeValue, useChart } from "@/components/provider"
import { dropProps } from "@/components/modern/menu"
import { getActivationProps } from "@/components/modern/status"
import MoreMenu, { useMenuItems } from "@/components/modern/header/moreMenu"
import AlertDot from "./alertDot"

const useStatusTarget = () => {
  const hasToolbox = useAttributeValue("hasToolbox")
  const items = useMenuItems()

  return hasToolbox ? items.find(item => item.statusTarget) : null
}

const TileStatus = ({ alert }) => {
  const chart = useChart()
  const ref = useRef()
  const target = useStatusTarget()
  const [drill, setDrill] = useState(null)

  if (!target) return <AlertDot alert={alert} />

  const close = () => setDrill(null)
  const back = () => setDrill(prev => (prev.length > 1 ? prev.slice(0, -1) : null))

  return (
    <>
      <AlertDot
        ref={ref}
        alert={alert}
        tabIndex={0}
        cursor="pointer"
        aria-expanded={!!drill}
        data-track={chart.track("alertStatus")}
        {...getActivationProps(() => setDrill(drill ? null : [target.id]))}
      />
      {ref.current && drill && (
        <Drop
          target={ref.current}
          onEsc={back}
          onClickOutside={close}
          data-toolbox={chart.getId()}
          {...dropProps}
          stretch={false}
        >
          <MoreMenu
            drill={drill}
            onDrill={id => setDrill(prev => [...prev, id])}
            onBack={back}
            onClose={close}
            itemFilter={item => item.id === target.id}
          />
        </Drop>
      )}
    </>
  )
}

export default TileStatus
