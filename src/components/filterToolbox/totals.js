import React from "react"
import { TextMicro } from "@netdata/netdata-ui"
import checkmark_s from "@netdata/netdata-ui/dist/components/icon/assets/checkmark_s.svg"
import warning_triangle_hollow from "@netdata/netdata-ui/dist/components/icon/assets/warning_triangle_hollow.svg"
import Icon from "@/components/icon"
import { useChart } from "@/components/provider"

const Totals = ({
  selected = [],
  qr = 0,
  fl = 0,
  sl = 0,
  ex = 0,
  teaser = false,
  resourceName,
  totalSelected,
}) => {
  const total = sl + ex
  const selectedCount = totalSelected || selected.length
  const queriedSelectedCount = selectedCount && selectedCount < qr ? selectedCount : qr
  const couldBeMore = fl > 0 || (teaser && qr < (selectedCount || total))
  const possiblesCount = (teaser ? selectedCount || total : selectedCount) || sl

  const chart = useChart()

  return (
    <TextMicro color="textLite">
      <TextMicro color={teaser ? "text" : "primary"}>{queriedSelectedCount}</TextMicro>
      {!teaser ? " queried" : " "}
      {!teaser && (
        <Icon
          margin={[-0.5, 1, -0.5, 0]}
          width="14px"
          height="14px"
          color="primary"
          svg={checkmark_s}
        />
      )}
      {!!fl && (
        <>
          {!teaser ? "+ " : <TextMicro color="errorLite"> +</TextMicro>}
          <TextMicro color="errorLite">{fl}</TextMicro>
          {!teaser ? "failed " : " "}
          <Icon
            margin={[-0.5, 1, -0.5, 0]}
            width="14px"
            height="14px"
            color="errorLite"
            svg={warning_triangle_hollow}
          />
        </>
      )}
      {couldBeMore && (
        <>
          of <TextMicro color={teaser ? "textLite" : "text"}>{possiblesCount}</TextMicro>
          {!teaser ? " selected" : " "}
        </>
      )}
      {!teaser && qr !== total && (
        <>
          of <TextMicro>{total}</TextMicro> available
        </>
      )}
      {resourceName
        ? chart.intl(resourceName, { count: couldBeMore ? possiblesCount : queriedSelectedCount })
        : ""}
    </TextMicro>
  )
}

export default Totals
