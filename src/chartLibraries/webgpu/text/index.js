import { parseColor } from "@/chartLibraries/webgpu/engine/color"
import makeAtlas from "./atlas"
import shader from "./shader"

const nextBufferSize = byteLength => {
  let size = 4
  while (size < byteLength) size *= 2
  return size
}

export const placeText = ({ x, y, width, height, align = "left", verticalAlign = "top" }) => ({
  x: align === "center" ? x - width / 2 : align === "right" ? x - width : x,
  y: verticalAlign === "middle" ? y - height / 2 : verticalAlign === "bottom" ? y - height : y,
  width,
  height,
})

const makePipeline = async runtime => {
  const { device, format } = runtime
  const module = device.createShaderModule({ label: "netdata-text-shader", code: shader })
  const compilation = await module.getCompilationInfo()
  const errors = compilation.messages.filter(message => message.type === "error")
  if (errors.length) throw new Error(errors.map(({ message }) => message).join("\n"))

  return device.createRenderPipelineAsync({
    label: "netdata-text-pipeline",
    layout: "auto",
    vertex: { module, entryPoint: "vertexMain" },
    fragment: {
      module,
      entryPoint: "fragmentMain",
      targets: [
        {
          format,
          blend: {
            color: {
              operation: "add",
              srcFactor: "src-alpha",
              dstFactor: "one-minus-src-alpha",
            },
            alpha: {
              operation: "add",
              srcFactor: "one",
              dstFactor: "one-minus-src-alpha",
            },
          },
        },
      ],
    },
    primitive: { topology: "triangle-list" },
  })
}

const resolveEntries = (atlas, labels, dpr) => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const generation = atlas.generation
    const entries = labels.map(({ text, font = "10px sans-serif" }) =>
      atlas.rasterize({ text: `${text}`, font, dpr })
    )
    if (atlas.generation === generation) return entries
  }
  throw new Error("WebGPU text atlas cannot fit the active label set")
}

export default async (runtime, surface) => {
  const { device, format } = runtime
  const [pipeline, atlas] = await Promise.all([
    runtime.getPipeline(`netdata-text-v1:${format}`, () => makePipeline(runtime)),
    runtime.getResource("netdata-text-atlas-v1", () => makeAtlas(runtime)),
  ])
  const sampler = device.createSampler({
    label: "netdata-text-sampler",
    magFilter: "linear",
    minFilter: "linear",
  })
  let uniform = null
  let instances = null
  let bindGroup = null
  let bindGroupGeneration = 0
  let count = 0
  let bufferBytes = 0

  const replaceBuffer = (current, next) => {
    bufferBytes += next.size - (current?.size || 0)
    if (current) surface.destroyAfterSubmission(current)
    return next
  }

  const ensureUniform = () => {
    if (uniform) return uniform
    uniform = replaceBuffer(
      uniform,
      device.createBuffer({
        label: "netdata-text-uniform",
        size: 16,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      })
    )
    bindGroup = null
    return uniform
  }

  const ensureInstances = byteLength => {
    if (instances && instances.size >= byteLength) return instances
    instances = replaceBuffer(
      instances,
      device.createBuffer({
        label: "netdata-text-instances",
        size: nextBufferSize(byteLength),
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      })
    )
    bindGroup = null
    return instances
  }

  const update = ({ labels, width, height, dpr }) => {
    count = labels.length
    if (!count) return

    const entries = resolveEntries(atlas, labels, dpr)
    const packed = new Float32Array(count * 12)
    labels.forEach((label, index) => {
      const entry = entries[index]
      if (!entry) return
      const placement = placeText({
        ...label,
        width: entry.width,
        height: entry.height,
      })
      const offset = index * 12
      packed.set(
        [
          placement.x * dpr,
          placement.y * dpr,
          placement.width * dpr,
          placement.height * dpr,
          entry.u0,
          entry.v0,
          entry.u1,
          entry.v1,
        ],
        offset
      )
      packed.set(parseColor(label.color), offset + 8)
    })

    const uniformBuffer = ensureUniform()
    const instanceBuffer = ensureInstances(packed.byteLength)
    device.queue.writeBuffer(uniformBuffer, 0, new Float32Array([width * dpr, height * dpr, 0, 0]))
    device.queue.writeBuffer(instanceBuffer, 0, packed)

    if (!bindGroup || bindGroupGeneration !== atlas.generation) {
      bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: uniformBuffer } },
          { binding: 1, resource: { buffer: instanceBuffer } },
          { binding: 2, resource: atlas.texture.createView() },
          { binding: 3, resource: sampler },
        ],
      })
      bindGroupGeneration = atlas.generation
    }
  }

  const encode = (pass, size) => {
    if (!count || !bindGroup) return false
    pass.setPipeline(pipeline)
    pass.setBindGroup(0, bindGroup)
    pass.setScissorRect(0, 0, size.width, size.height)
    pass.draw(6, count)
    return true
  }

  const destroy = () => {
    if (uniform) surface.destroyAfterSubmission(uniform)
    if (instances) surface.destroyAfterSubmission(instances)
    uniform = null
    instances = null
    bindGroup = null
    count = 0
    bufferBytes = 0
  }

  return {
    update,
    encode,
    destroy,
    needsUpdate: () => bindGroupGeneration !== atlas.generation,
    getBufferBytes: () => bufferBytes,
  }
}
