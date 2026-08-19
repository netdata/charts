export default `
const MODE_STEP: u32 = 1u;

struct Uniforms {
  domain: vec4<f32>,
  plot: vec4<f32>,
  canvas: vec4<f32>,
  fill: vec4<f32>,
  counts: vec4<u32>,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage, read> xValues: array<f32>;
@group(0) @binding(2) var<storage, read> yValues: array<f32>;
@group(0) @binding(3) var<storage, read> seriesColors: array<vec4<f32>>;
@group(0) @binding(4) var<storage, read> baseValues: array<f32>;

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) @interpolate(flat) color: vec4<f32>,
};

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

fn toScreen(point: vec2<f32>) -> vec2<f32> {
  let xRange = max(uniforms.domain.y - uniforms.domain.x, 1e-20);
  let yRange = max(uniforms.domain.w - uniforms.domain.z, 1e-20);
  let x = uniforms.plot.x + ((point.x - uniforms.domain.x) / xRange) * uniforms.plot.z;
  let y = uniforms.plot.y + (1.0 - (point.y - uniforms.domain.z) / yRange) * uniforms.plot.w;
  return vec2<f32>(x, y);
}

fn hiddenOutput(color: vec4<f32>) -> VertexOutput {
  var output: VertexOutput;
  output.position = vec4<f32>(0.0, 0.0, 0.0, 0.0);
  output.color = color;
  return output;
}

@vertex
fn vertexMain(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32,
) -> VertexOutput {
  let pairsPerSeries = uniforms.counts.x - 1u;
  let seriesIndex = instanceIndex / pairsPerSeries;
  let pairIndex = instanceIndex % pairsPerSeries;
  let offset = pairIndex * uniforms.counts.y + seriesIndex;

  let x0 = xValues[pairIndex];
  let x1 = xValues[pairIndex + 1u];
  let end0 = yValues[offset];
  let nextOffset = (pairIndex + 1u) * uniforms.counts.y + seriesIndex;
  let end1 = yValues[nextOffset];
  let base0 = baseValues[offset];
  let base1 = baseValues[nextOffset];
  let color = seriesColors[seriesIndex];
  if (
    end0 != end0 || end1 != end1 || base0 != base0 || base1 != base1 ||
    color.a <= 0.0 || uniforms.fill.y <= 0.0
  ) {
    return hiddenOutput(color);
  }

  let topA = toScreen(vec2<f32>(x0, end0));
  var topB = toScreen(vec2<f32>(x1, end1));
  if (u32(uniforms.canvas.w) == MODE_STEP) {
    topB.y = topA.y;
  }
  let baselineA = toScreen(vec2<f32>(x0, base0));
  let baselineB = toScreen(vec2<f32>(x1, base1));
  let quad = quadCoordinates(vertexIndex);
  let top = mix(topA, topB, quad.x);
  let baseline = mix(baselineA, baselineB, quad.x);
  let point = mix(top, baseline, quad.y);

  var output: VertexOutput;
  output.position = vec4<f32>(
    point.x / uniforms.canvas.x * 2.0 - 1.0,
    1.0 - point.y / uniforms.canvas.y * 2.0,
    0.0,
    1.0
  );
  output.color = vec4<f32>(color.rgb, color.a * uniforms.fill.y);
  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  return input.color;
}
`
