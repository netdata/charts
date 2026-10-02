import styled from "styled-components"
import { Table, getColor } from "@netdata/netdata-ui"

const ModernTable = styled(Table)`
  [data-testid^="netdata-table-row"] {
    border-bottom-color: ${getColor("borderSecondary")};
  }
`

export const modernTableProps = { coloredSortedColumn: false }

export default ModernTable
