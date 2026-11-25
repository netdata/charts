import { Flex, TextSmall, TextMicro } from "@netdata/netdata-ui"
import { useAttributeValue } from "@/components/provider"
import Tooltip from "@/components/tooltip"

const LabelsTooltip = ({ labels, instanceName }) => (
  <Flex column gap={0.5}>
    {labels.map(([name, value]) => (
      <TextMicro key={name} color="tooltipText">
        <TextMicro strong color="tooltipText">
          {name}
        </TextMicro>{" "}
        {value}
      </TextMicro>
    ))}
    <TextMicro color="tooltipText">{instanceName}</TextMicro>
  </Flex>
)

const InstanceIdentity = ({ row, ...rest }) => {
  const id = useAttributeValue("id")
  const { labelPairs, labelRest = [], ambiguous, nodeName, info } = row.original

  return (
    <Tooltip
      content={<LabelsTooltip labels={[...labelPairs, ...labelRest]} instanceName={info.nm} />}
      data-toolbox={id}
      align="bottom"
    >
      <Flex alignItems="baseline" gap={1} flexWrap data-testid="instance-identity" {...rest}>
        {labelPairs.map(([name, value]) => (
          <Flex key={name} gap={0.5} alignItems="baseline">
            <TextSmall strong color="textDescription" whiteSpace="nowrap">
              {name}
            </TextSmall>
            <TextSmall wordBreak="break-word">{value}</TextSmall>
          </Flex>
        ))}
        <Flex gap={1} alignItems="baseline">
          {!!labelRest.length && (
            <TextSmall color="textLite" whiteSpace="nowrap">
              +{labelRest.length}
            </TextSmall>
          )}
          <TextSmall color="textLite" wordBreak="break-word">
            @ {nodeName}
          </TextSmall>
        </Flex>
        {ambiguous && (
          <TextMicro color="textLite" wordBreak="break-word">
            {info.nm}
          </TextMicro>
        )}
      </Flex>
    </Tooltip>
  )
}

export const hasIdentity = row => !!row.original.labelPairs?.length

export default InstanceIdentity
