import { useAttributeValue } from "@/components/provider"
import Identity from "./identity"

const InstanceIdentity = ({ row, ...rest }) => {
  const id = useAttributeValue("id")
  const { labelPairs, labelRest, ambiguous, nodeName, info } = row.original

  return (
    <Identity
      labelPairs={labelPairs}
      labelRest={labelRest}
      ambiguous={ambiguous}
      nodeName={nodeName}
      name={info.nm}
      data-toolbox={id}
      {...rest}
    />
  )
}

export const hasIdentity = row => !!row.original.labelPairs?.length

export default InstanceIdentity
