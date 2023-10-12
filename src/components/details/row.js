import React from "react"
import { Text, Flex } from "@netdata/netdata-ui"

const Row = ({ icon, title, children, ...rest }) => {
  return (
    <Flex gap={4} {...rest}>
      {icon}
      <Flex column gap={1} flex="grow" basis={0}>
        <Text strong color="key">
          {title}
        </Text>
        {children && (
          <Flex column gap={1}>
            {children}
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}

export default Row
