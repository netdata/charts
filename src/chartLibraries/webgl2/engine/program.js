const compileShader = (gl, type, source) => {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  return shader
}

const nextTask = () => new Promise(resolve => setTimeout(resolve))

export default async (gl, vertexSource, fragmentSource) => {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource)
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource)
  const program = gl.createProgram()
  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)
  gl.flush()

  const completion = gl.getExtension("KHR_parallel_shader_compile")
  while (completion && !gl.getProgramParameter(program, completion.COMPLETION_STATUS_KHR)) {
    await nextTask()
  }

  const errors = [vertex, fragment]
    .filter(shader => !gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    .map(shader => gl.getShaderInfoLog(shader))
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) errors.push(gl.getProgramInfoLog(program))
  gl.deleteShader(vertex)
  gl.deleteShader(fragment)
  if (errors.length) {
    gl.deleteProgram(program)
    throw new Error(errors.join("\n"))
  }
  return program
}
