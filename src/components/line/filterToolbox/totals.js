import React from "react"
import { TextMicro } from "@netdata/netdata-ui/lib/components/typography"
import checkmark_s from "@netdata/netdata-ui/lib/components/icon/assets/checkmark_s.svg"
import warning_triangle_hollow from "@netdata/netdata-ui/lib/components/icon/assets/warning_triangle_hollow.svg"
import Icon from "@/components/icon"

const Totals = ({ selected = [], qr = 0, fl = 0, sl = 0, ex = 0, teaser = false }) => (
  <TextMicro color="textLite">
    <TextMicro color="primary">{qr}</TextMicro>
    {!teaser && " queried"}
    <Icon
      margin={[-0.5, 1, -0.5, 0]}
      width="14px"
      height="14px"
      color="primary"
      svg={checkmark_s}
    />
    {!!fl && (
      <>
        {!teaser && "+"}
        <TextMicro color="errorLite">{fl}</TextMicro>
        {!teaser && "failed"}
        <Icon
          margin={[-0.5, 1, -0.5, 0]}
          width="14px"
          height="14px"
          color="errorLite"
          svg={warning_triangle_hollow}
        />
      </>
    )}
    {!teaser && "of "}
    <TextMicro>{selected.length || sl + ex}</TextMicro>
    {!teaser && " selected, out of "}
    <TextMicro>{sl + ex}</TextMicro>
    {!teaser && " available"}
  </TextMicro>
)

export default Totals
