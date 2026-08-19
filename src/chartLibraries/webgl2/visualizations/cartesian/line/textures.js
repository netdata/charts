export const makeTextureLayout = (values, components, maxTextureSize) => {
  const texelCount = Math.max(1, Math.ceil(values.length / components))
  const width = Math.min(maxTextureSize, texelCount)
  const height = Math.ceil(texelCount / width)
  if (height > maxTextureSize)
    throw new Error("WebGL2 texture capacity exceeded")

  const valueCount = width * height * components
  if (values.length === valueCount) return { width, height, values }
  const padded = new values.constructor(valueCount)
  padded.set(values)
  return { width, height, values: padded }
}

export const updateTexture = ({
  gl,
  texture,
  state,
  values,
  components,
  internalFormat,
  format,
  maxTextureSize,
}) => {
  const layout = makeTextureLayout(values, components, maxTextureSize)
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  if (state.width !== layout.width || state.height !== layout.height) {
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      internalFormat,
      layout.width,
      layout.height,
      0,
      format,
      gl.FLOAT,
      layout.values
    )
  } else {
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      0,
      0,
      layout.width,
      layout.height,
      format,
      gl.FLOAT,
      layout.values
    )
  }
  state.width = layout.width
  state.height = layout.height
  state.byteLength = layout.values.byteLength
}
