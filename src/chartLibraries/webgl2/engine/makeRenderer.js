import makeRenderer from "@/chartLibraries/gpu/engine/makeRenderer"
import { getWebGL2Runtime, isWebGL2Supported } from "./runtime"

export default options =>
  makeRenderer({
    ...options,
    rendererId: "webgl2",
    fallbackRenderer: null,
    getRuntime: getWebGL2Runtime,
    isRuntimeSupported: isWebGL2Supported,
    makeLossError: info => new Error(`${info.reason}: ${info.message}`),
  })
