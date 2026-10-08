const types = Object.freeze({
  int: Object.freeze({ method: "uniform1i", size: 1 }),
  ivec2: Object.freeze({ method: "uniform2iv", size: 2 }),
  vec3: Object.freeze({ method: "uniform3fv", size: 3 }),
  vec4: Object.freeze({ method: "uniform4fv", size: 4 }),
  uvec4: Object.freeze({ method: "uniform4uiv", size: 4 }),
})

export const validateUniformValue = (name, type, value) => {
  const definition = types[type]
  if (!definition) throw new Error(`Unknown uniform type ${type} for ${name}`)

  if (definition.size === 1) {
    if (!Number.isFinite(value))
      throw new Error(`Uniform ${name} requires one finite value`)
    return definition
  }

  if (!value || value.length !== definition.size)
    throw new Error(
      `Uniform ${name} requires exactly ${definition.size} values`
    )
  return definition
}

export default (gl, program, schema) => {
  const records = Object.entries(schema).map(([name, type]) => ({
    name,
    type,
    location: gl.getUniformLocation(program, name),
  }))

  return values => {
    records.forEach(({ name, type, location }) => {
      const value = values[name]
      if (value === undefined) return
      const { method, size } = validateUniformValue(name, type, value)
      if (size === 1) gl[method](location, value)
      else gl[method](location, value)
    })
  }
}
