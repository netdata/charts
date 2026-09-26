import { validateUniformValue } from "./uniforms"

describe("WebGL2 uniform contracts", () => {
  it.each([
    ["int", 1],
    ["ivec2", [1, 2]],
    ["vec3", [1, 2, 3]],
    ["vec4", [1, 2, 3, 4]],
    ["uvec4", new Uint32Array([1, 2, 3, 4])],
  ])("accepts exact %s values", (type, value) => {
    expect(validateUniformValue("uValue", type, value)).toBeDefined()
  })

  it.each([
    ["ivec2", [1]],
    ["vec3", [1, 2, 3, 4]],
    ["vec4", [1, 2, 3]],
    ["uvec4", [1, 2, 3, 4, 5]],
  ])("rejects incorrect %s arity", (type, value) => {
    expect(() => validateUniformValue("uValue", type, value)).toThrow(
      /requires exactly/
    )
  })

  it("rejects unknown types and non-finite scalar values", () => {
    expect(() => validateUniformValue("uValue", "matrix", [])).toThrow(
      /Unknown uniform type/
    )
    expect(() => validateUniformValue("uValue", "int", NaN)).toThrow(
      /requires one finite value/
    )
  })
})
