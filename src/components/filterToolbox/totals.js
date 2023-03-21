import React from "react"
import { TextMicro } from "@netdata/netdata-ui/lib/components/typography"
import checkmark_s from "@netdata/netdata-ui/lib/components/icon/assets/checkmark_s.svg"
import warning_triangle_hollow from "@netdata/netdata-ui/lib/components/icon/assets/warning_triangle_hollow.svg"
import Icon from "@/components/icon"

const Totals = ({
  selected = [],
  qr = 0,
  fl = 0,
  sl = 0,
  ex = 0,
  teaser = false,
  resourceName,
}) => {
  const total = sl + ex
  const selectedCount = selected.length && selected.length < qr ? selected.length : qr
  const couldBeMore = fl > 0 || (teaser && qr < (selected.length || total))
  const possiblesCount = (teaser ? selected.length || total : selected.length) || sl
  return (
    <TextMicro color="textLite">
      <TextMicro color={teaser ? "text" : "primary"}>{selectedCount}</TextMicro>
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
          {!teaser ? "+ " : " "}
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
          {!teaser ? " selected" : ""}
        </>
      )}
      {!teaser && qr !== total && (
        <>
          out of <TextMicro>{total}</TextMicro> available
        </>
      )}
      {resourceName
        ? couldBeMore
          ? possiblesCount === 1
            ? ` ${resourceName}`
            : ` ${resourceName}s`
          : selectedCount === 1
          ? ` ${resourceName}`
          : ` ${resourceName}s`
        : ""}
    </TextMicro>
  )
}

export default Totals
