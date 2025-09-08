import React from "react"
import { Flex, Text } from "@netdata/netdata-ui"
import Controls from "./controls"
import Table from "./table"
import useData from "./useData"

const Correlate = () => {
  const { loading, error, data } = useData()

  return (
    <Flex column gap={2}>
      <Controls />

      {error && (
        <Flex justifyContent="center" padding={[2, 0]}>
          <Text color="error">Error: {error}</Text>
        </Flex>
      )}

      {data && data.length > 0 && !loading && <Table data={data} />}
    </Flex>
  )
}

export default Correlate
