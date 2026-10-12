import React from "react"
import { Flex, TextSmall } from "@netdata/netdata-ui"

const onEnter = action => event => {
  if (event.key === "Enter" || event.key === " ") action()
}

const Breadcrumb = ({ crumbs, onSelect }) => (
  <Flex alignItems="center" gap={2} data-testid="groupBoxesTreemap-breadcrumb">
    {crumbs.map(({ path, name, count }, index) => {
      const last = index === crumbs.length - 1
      const select = () => onSelect(path)
      return (
        <Flex key={path.join(",") || "root"} alignItems="center" gap={2}>
          {index > 0 && <TextSmall color="textLite">›</TextSmall>}
          <Flex
            alignItems="baseline"
            gap={1}
            cursor={last ? "default" : "pointer"}
            role={last ? undefined : "button"}
            tabIndex={last ? undefined : 0}
            onClick={last ? undefined : select}
            onKeyDown={last ? undefined : onEnter(select)}
            data-testid={index === 0 ? "groupBoxesTreemap-crumb-root" : "groupBoxesTreemap-crumb"}
          >
            <TextSmall strong={last} color={last ? "text" : "textLite"}>
              {name}
            </TextSmall>
            <TextSmall color="textLite">{String(count)}</TextSmall>
          </Flex>
        </Flex>
      )
    })}
  </Flex>
)

export default Breadcrumb
