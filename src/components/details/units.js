import React from "react"
import { useUnitSign } from "@/components/provider"
import Row from "./row"
import Info from "./info"

const Units = () => {
  const rawUnits = useUnitSign({ withoutConversion: true, long: true })
  const viewUnits = useUnitSign({ long: true })

  return (
    <Row title="Units" color="key" data-testid="cartDetails-units">
      <Info title="Raw data units">{rawUnits}</Info>
      <Info title="Visualization units">{viewUnits}</Info>
    </Row>
  )
}

export default Units
