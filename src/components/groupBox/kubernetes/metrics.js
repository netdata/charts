import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import Section from "./section"
import Chart from "./chart"
import DateSection from "./dateSection"

const Metrics = ({ groupLabel, postGroupLabel, attributes, viewAfter, viewBefore }) => (
  <Flex gap={3} column width="100%" data-testid="k8sPopoverMetrics">
    <DateSection after={viewAfter} before={viewBefore} />
    <Section title="Metrics" noBorder>
      <Flex gap={3} column data-testid="k8sPopoverMetrics-container">
        {attributes.relatedCharts.map(({ chartMetadata }, index) => (
          <Chart
            key={chartMetadata.id}
            id={[groupLabel, postGroupLabel, attributes.id, chartMetadata.id].join("|")}
            attributes={attributes}
            relatedIndex={index}
            groupLabel={groupLabel}
            postGroupLabel={postGroupLabel}
          />
        ))}
      </Flex>
    </Section>
  </Flex>
)

export default Metrics
