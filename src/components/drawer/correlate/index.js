import React from "react"
import { Flex, Text } from "@netdata/netdata-ui"
import Controls from "./controls"
import Table from "./table"
import useData from "./useData"

const Correlate = () => {
  const { loading, error, data } = useData()

  return (
    <Flex
      flex
      column
      gap={2}
      height={{ min: "0px", base: "100%" }}
      overflow="hidden"
    >
      <Flex flex={false}>
        <Controls />
      </Flex>

      {error && (
        <Flex justifyContent="center" padding={[2, 0]}>
          <Text color="error">Error: {error}</Text>
        </Flex>
      )}

      {loading && !data?.length && (
        <Flex justifyContent="center" padding={[2, 0]}>
          <Text color="textLite">Loading correlations...</Text>
        </Flex>
      )}

      {!loading && !error && data?.length === 0 && (
        <Flex justifyContent="center" padding={[4, 0]}>
          <Text color="textLite">No correlations found</Text>
        </Flex>
      )}

      {data && data.length > 0 && <Table data={data} />}
    </Flex>
  )
}

export default Correlate
