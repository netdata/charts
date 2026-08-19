export default `
struct Uniforms {
  canvas: vec2<f32>,
  padding: vec2<f32>,
};

struct Circle {
  geometry: vec4<f32>,
  color: vec4<f32>,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage, read> circles: array<Circle>;

fn quadCoordinates(vertexIndex: u32) -> vec2<f32> {
  switch vertexIndex {
    case 0u: { return vec2<f32>(-1.0, -1.0); }
    case 1u: { return vec2<f32>(1.0, -1.0); }
    case 2u: { return vec2<f32>(-1.0, 1.0); }
    case 3u: { return vec2<f32>(-1.0, 1.0); }
    case 4u: { return vec2<f32>(1.0, -1.0); }
    default: { return vec2<f32>(1.0, 1.0); }
  }
}

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) local: vec2<f32>,
  @location(1) color: vec4<f32>,
};

@vertex
fn vertexMain(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32,
) -> VertexOutput {
  let circle = circles[instanceIndex];
  let local = quadCoordinates(vertexIndex);
  let point = circle.geometry.xy + local * circle.geometry.z;
  let clipX = point.x / uniforms.canvas.x * 2.0 - 1.0;
  let clipY = 1.0 - point.y / uniforms.canvas.y * 2.0;

  var output: VertexOutput;
  output.position = vec4<f32>(clipX, clipY, 0.0, 1.0);
  output.local = local;
  output.color = circle.color;
  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  let distance = length(input.local);
  let antialias = max(fwidth(distance), 1e-3);
  let coverage = 1.0 - smoothstep(1.0 - antialias, 1.0, distance);
  return vec4<f32>(input.color.rgb, input.color.a * coverage);
}
`
