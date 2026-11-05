import React from "react"
import { FontLink } from "./primitives"
import { TableMockups } from "./table"

export const Table = ({ theme }) => (
  <div style={{ minWidth: 1340 }}>
    <FontLink />
    <TableMockups theme={theme} />
  </div>
)
Table.args = { theme: "dark" }
Table.argTypes = { theme: { control: "radio", options: ["dark", "light"] } }

export default {
  title: "Mockups/Table",
  parameters: { layout: "fullscreen" },
}
