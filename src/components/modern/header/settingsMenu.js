import { useState } from "react"
import SettingsContent from "@/components/toolbox/settings/content"
import MoreMenu from "./moreMenu"
import { settingsItems } from "./settingsItems"

const settingsIds = new Set(settingsItems.map(item => item.id))

const isSettingsItem = item => settingsIds.has(item.id) || item.id.startsWith("tab-")

const SettingsMenu = ({ hasFilters = false, onClose }) => {
  const [drill, setDrill] = useState([])
  const [tabIndex, setTabIndex] = useState(null)

  if (tabIndex !== null) return <SettingsContent initialIndex={tabIndex} onClose={onClose} />

  return (
    <MoreMenu
      drill={drill}
      onDrill={id => setDrill(prev => [...prev, id])}
      onBack={() => setDrill(prev => prev.slice(0, -1))}
      onClose={onClose}
      onOpenTab={setTabIndex}
      hasFilters={hasFilters}
      itemFilter={isSettingsItem}
    />
  )
}

export default SettingsMenu
