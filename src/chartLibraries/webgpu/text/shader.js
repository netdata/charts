export default `
struct Uniforms {
  canvas: vec2<f32>,
  padding: vec2<f32>,
};

struct TextInstance {
  geometry: vec4<f32>,
  uv: vec4<f32>,
  color: vec4<f32>,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage, read> instances: array<TextInstance>;
@group(0) @binding(2) var atlas: texture_2d<f32>;
@group(0) @binding(3) var atlasSampler: sampler;

fn quadCoordinates(vertexIndex: u32) -> vec2<f32> {
  switch vertexIndex {
    case 0u: { return vec2<f32>(0.0, 0.0); }
    case 1u: { return vec2<f32>(1.0, 0.0); }
    case 2u: { return vec2<f32>(0.0, 1.0); }
    case 3u: { return vec2<f32>(0.0, 1.0); }
    case 4u: { return vec2<f32>(1.0, 0.0); }
    default: { return vec2<f32>(1.0, 1.0); }
  }
}

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
  @location(1) color: vec4<f32>,
};

@vertex
fn vertexMain(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32,
) -> VertexOutput {
  let instance = instances[instanceIndex];
  let quad = quadCoordinates(vertexIndex);
  let point = instance.geometry.xy + quad * instance.geometry.zw;
  let clipX = point.x / uniforms.canvas.x * 2.0 - 1.0;
  let clipY = 1.0 - point.y / uniforms.canvas.y * 2.0;

  var output: VertexOutput;
  output.position = vec4<f32>(clipX, clipY, 0.0, 1.0);
  output.uv = mix(instance.uv.xy, instance.uv.zw, quad);
  output.color = instance.color;
  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  let alpha = textureSample(atlas, atlasSampler, input.uv).a;
  return vec4<f32>(input.color.rgb, input.color.a * alpha);
}
`
