import Icon, { Button } from "@/components/icon"
import { useMenuItems } from "./moreMenu"

const byPinOrder = (a, b) => (a.pin.order ?? 0) - (b.pin.order ?? 0)

const getTitle = ({ label, hint }) => (hint ? `${label} (${hint})` : label)

const PinnedAction = ({ descriptor, menuProps }) => {
  const item = descriptor.useItem(menuProps)

  if (!item || item.hidden || item.disabled || !item.onClick) return null

  const { icon, testId } = descriptor.pin
  const { chart } = menuProps

  return (
    <Button
      icon={<Icon svg={icon} width="16px" height="16px" />}
      title={getTitle(item)}
      active={!!item.check}
      aria-pressed={item.check === undefined ? undefined : !!item.check}
      onClick={item.onClick}
      data-testid={testId}
      data-track={item.track ? chart.track(item.track) : undefined}
    />
  )
}

const PinnedActions = ({ menuProps }) => {
  const pinned = useMenuItems()
    .filter(item => !!item.pin)
    .sort(byPinOrder)

  return pinned.map(descriptor => (
    <PinnedAction key={descriptor.id} descriptor={descriptor} menuProps={menuProps} />
  ))
}

export default PinnedActions
