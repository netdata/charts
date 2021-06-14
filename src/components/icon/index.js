import React, { useEffect, useMemo } from "react"
import md5 from "md5"
import { StyledIcon } from "@netdata/netdata-ui/lib/components/icon/styled"

export { default as Button } from "./button"

const iconsContainerId = "netdata-sdk-svg"

const iconsContainer = `<svg
    id="${iconsContainerId}"
    aria-hidden="true"
    style="position: absolute; width: 0; height: 0; overflow: hidden;"
  >
    <defs />
  </svg>`

const injectContainer = () => {
  if (document.querySelector(`#${iconsContainerId}`)) return

  const container = document.createElement("div")
  container.innerHTML = iconsContainer
  document.body.insertBefore(container.firstChild.cloneNode(true), document.body.firstChild)
}

const Icon = ({ svg, size = "24px", width = size, height = size, ...rest }) => {
  const id = useMemo(() => md5(svg), [])

  useEffect(() => {
    if (document.getElementById(id)) return

    injectContainer()

    const defs = document.querySelector(`#${iconsContainerId} defs`)

    const svgContainer = document.createElement("div")
    svgContainer.innerHTML = svg
    svgContainer.firstChild.id = id

    defs.appendChild(svgContainer.firstChild)
  }, [])

  return (
    <StyledIcon width={width} height={height} {...rest}>
      <use xlinkHref={`#${id}`} />
    </StyledIcon>
  )
}

export default Icon
