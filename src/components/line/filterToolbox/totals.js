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
}) => (
  <TextMicro color="textLite">
    <TextMicro color={teaser ? "textLite" : "primary"}>{qr}</TextMicro>
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
    {(fl > 0 || (teaser && qr !== (selected.length || sl + ex))) && (
      <>
        of <TextMicro>{(teaser ? selected.length || sl + ex : selected.length) || sl}</TextMicro>
        {!teaser ? " selected" : ""}
      </>
    )}
    {!teaser && qr !== sl + ex && (
      <>
        out of <TextMicro>{sl + ex}</TextMicro> available
      </>
    )}
    {resourceName && (sl + ex > 1 ? ` ${resourceName}s` : ` ${resourceName}`)}
  </TextMicro>
)

export default Totals
