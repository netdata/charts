import React, { memo } from "react"
import styled from "styled-components"
import { CopyToClipboard, Flex, TextNano } from "@netdata/netdata-ui"
import plusIcon from "@netdata/netdata-ui/dist/components/icon/assets/plus.svg"
import copyIcon from "@netdata/netdata-ui/dist/components/icon/assets/copy.svg"
import trashcanIcon from "@netdata/netdata-ui/dist/components/icon/assets/trashcan.svg"
import xIcon from "@netdata/netdata-ui/dist/components/icon/assets/x.svg"
import Icon, { Button } from "@/components/icon"
import Tooltip from "@/components/tooltip"
import { useAttributeValue, useChart, useFormatDate, useFormatTime } from "@/components/provider"
import { Divider } from "../highlight"

const Bar = styled(Flex).attrs({
  alignItems: "center",
  gap: 1,
  padding: [0.5, 1, 0.5, 2],
  round: 2,
  border: { side: "all", color: "borderSecondary" },
  background: "mainBackground",
  zIndex: 10,
  "data-testid": "click-actions",
})``

const Action = ({ label, svg, ...rest }) => (
  <Tooltip content={label}>
    <Button icon={<Icon svg={svg} size="16px" />} aria-label={label} padding="2px" {...rest} />
  </Tooltip>
)

const ClickActions = ({ annotation }) => {
  const chart = useChart()
  const canCreateAnnotations = useAttributeValue("canCreateAnnotations")
  const timestampMs = annotation.timestamp * 1000
  const date = useFormatDate(timestampMs)
  const time = useFormatTime(timestampMs)

  const annotate = () =>
    chart.updateAttribute("draftAnnotation", { ...annotation, status: "editing" })

  const close = () => chart.updateAttribute("draftAnnotation", null)

  const clear = () => {
    chart.updateAttributes({ draftAnnotation: null, clickX: null })
    chart.trigger("clickPointClear")
    chart.sdk.trigger("clickPointClear", chart)
  }

  return (
    <Bar data-track={chart.track("click-actions")}>
      <TextNano color="textLite" whiteSpace="nowrap">{`${date} • ${time}`}</TextNano>
      <Divider />
      <Flex alignItems="center" gap={0.5}>
        {canCreateAnnotations && (
          <Action
            label="Add annotation"
            svg={plusIcon}
            onClick={annotate}
            data-testid="click-actions-annotate"
            data-track={chart.track("annotation-start-editing")}
          />
        )}
        <CopyToClipboard text={new Date(timestampMs).toISOString()}>
          <Action
            label="Copy time"
            svg={copyIcon}
            data-testid="click-actions-copy"
            data-track={chart.track("click-actions-copy")}
          />
        </CopyToClipboard>
        <Action
          label="Clear clicked point"
          svg={trashcanIcon}
          onClick={clear}
          data-testid="click-actions-clear"
          data-track={chart.track("click-actions-clear")}
        />
        <Action
          label="Close"
          svg={xIcon}
          onClick={close}
          data-testid="click-actions-close"
          data-track={chart.track("click-actions-close")}
        />
      </Flex>
    </Bar>
  )
}

export default memo(ClickActions)
