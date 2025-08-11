import React, { useRef, useState } from "react"
import { Drop } from "@netdata/netdata-ui"
import settings from "@netdata/netdata-ui/dist/components/icon/assets/settings.svg"
import Icon, { Button } from "@/components/icon"
import { useChart } from "@/components/provider"
import SettingsContent from "./settings/index"

const SettingsDropdown = ({ chart, onClose }) => <SettingsContent chart={chart} onClose={onClose} />

const Settings = ({ disabled }) => {
  const ref = useRef()
  const chart = useChart()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        ref={ref}
        icon={<Icon svg={settings} size="16px" />}
        title="Settings"
        disabled={disabled}
        data-testid="chartHeaderToolbox-settings"
        onClick={() => setIsOpen(prev => !prev)}
        data-track={chart.track("settings")}
      />
      {ref.current && isOpen && (
        <Drop
          target={ref.current}
          align={{ top: "bottom", right: "right" }}
          onEsc={() => setIsOpen(false)}
          onClickOutside={() => setIsOpen(false)}
          data-toolbox={chart.getId()}
          background="modalBackground"
          margin={[2, 0, 0]}
          round
        >
          <SettingsContent chart={chart} onClose={() => setIsOpen(false)} />
        </Drop>
      )}
    </>
  )
}

export default Settings
