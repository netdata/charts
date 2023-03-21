import React from "react"
import { useInitialLoading } from "@/components/provider"
import Skeleton from "./skeleton"

export default Component => {
  const WithLoader = props => {
    const initialLoading = useInitialLoading()

    return initialLoading ? <Skeleton {...props} /> : <Component {...props} />
  }

  return WithLoader
}
