import { Flex, TextSmall, TextMicro } from "@netdata/netdata-ui"
import Tooltip from "@/components/tooltip"

const noLabels = []

const LabelsTooltip = ({ labels, name }) => (
  <Flex column gap={0.5}>
    {labels.map(([labelName, value]) => (
      <TextMicro key={labelName} color="tooltipText">
        <TextMicro strong color="tooltipText">
          {labelName}
        </TextMicro>{" "}
        {value}
      </TextMicro>
    ))}
    <TextMicro color="tooltipText">{name}</TextMicro>
  </Flex>
)

const Identity = ({
  labelPairs,
  labelRest = noLabels,
  ambiguous,
  nodeName,
  name,
  "data-toolbox": toolbox,
  ...rest
}) => (
  <Tooltip
    content={<LabelsTooltip labels={[...labelPairs, ...labelRest]} name={name} />}
    data-toolbox={toolbox}
    align="bottom"
  >
    <Flex alignItems="baseline" gap={1} flexWrap data-testid="instance-identity" {...rest}>
      {labelPairs.map(([labelName, value]) => (
        <Flex key={labelName} gap={0.5} alignItems="baseline">
          <TextSmall strong color="textDescription" whiteSpace="nowrap">
            {labelName}
          </TextSmall>
          <TextSmall wordBreak="break-word">{value}</TextSmall>
        </Flex>
      ))}
      {(!!labelRest.length || !!nodeName) && (
        <Flex gap={1} alignItems="baseline">
          {!!labelRest.length && (
            <TextSmall color="textLite" whiteSpace="nowrap">
              +{labelRest.length}
            </TextSmall>
          )}
          {!!nodeName && (
            <TextSmall color="textLite" wordBreak="break-word">
              @ {nodeName}
            </TextSmall>
          )}
        </Flex>
      )}
      {ambiguous && (
        <TextMicro color="textLite" wordBreak="break-word">
          {name}
        </TextMicro>
      )}
    </Flex>
  </Tooltip>
)

export default Identity
