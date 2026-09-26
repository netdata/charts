import { fragmentSource } from "./shader/fragment"
import { vertexCommon } from "./shader/common"
import { vertexFilled } from "./shader/filled"
import { vertexLine } from "./shader/line"
import { vertexPrimitives } from "./shader/primitives"

export const vertexShader = [
  vertexCommon,
  vertexPrimitives,
  vertexFilled,
  vertexLine,
].join("\n")

export const fragmentShader = fragmentSource
