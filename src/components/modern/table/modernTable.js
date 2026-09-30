import styled from "styled-components"
import { Table, getColor } from "@netdata/netdata-ui"

// netdata-ui rows draw a full-strength bottom border; the modern table keeps a quieter rule.
const ModernTable = styled(Table)`
  [data-testid^="netdata-table-row"] {
    border-bottom-color: ${getColor("borderSecondary")};
  }
`

export const modernTableProps = { coloredSortedColumn: false }

export default ModernTable
