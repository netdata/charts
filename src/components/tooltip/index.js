import { Tooltip as BaseTooltip } from "@netdata/netdata-ui"
import { useAttributeValue } from "@/components/provider"

const Tooltip = ({ content, ...rest }) => (
  <BaseTooltip
    content={content || ""}
    {...rest}
    dropProps={{ "data-toolbox": rest["data-toolbox"] }}
    zIndex={100}
  />
)

export const withTooltip =
  (Component, tooltipDefaultProps = {}) =>
  ({ title, ...rest }) => {
    const id = useAttributeValue("id")

    if (!title) return <Component {...rest} />

    return (
      <Tooltip
        content={title}
        disabled={rest.open}
        data-toolbox={id}
        align="bottom"
        {...tooltipDefaultProps}
        {...rest.tooltipProps}
      >
        <Component aria-label={typeof title === "string" ? title : undefined} {...rest} />
      </Tooltip>
    )
  }

export default Tooltip
