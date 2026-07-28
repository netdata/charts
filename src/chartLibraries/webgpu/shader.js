export default `
const AA_PADDING: f32 = 1.0;

struct Uniforms {
  domain: vec4<f32>,
  plot: vec4<f32>,
  canvas: vec4<f32>,
  counts: vec4<u32>,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage, read> xValues: array<f32>;
@group(0) @binding(2) var<storage, read> yValues: array<f32>;
@group(0) @binding(3) var<storage, read> seriesColors: array<vec4<f32>>;

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) across: f32,
  @location(1) @interpolate(flat) width: f32,
  @location(2) @interpolate(flat) color: vec4<f32>,
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

fn gapOutput(color: vec4<f32>) -> VertexOutput {
  var output: VertexOutput;
  output.position = vec4<f32>(-2.0, -2.0, 0.0, 1.0);
  output.across = 0.0;
  output.width = 0.0;
  output.color = color;
  return output;
}

@vertex
fn vertexMain(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32,
) -> VertexOutput {
  let pointCount = uniforms.counts.x;
  let segmentsPerPair = uniforms.counts.z;
  let segmentsPerSeries = uniforms.counts.w;
  let seriesIndex = instanceIndex / segmentsPerSeries;
  let localSegment = instanceIndex % segmentsPerSeries;
  let pairIndex = localSegment / segmentsPerPair;
  let stepSegment = localSegment % segmentsPerPair;
  let yOffset = seriesIndex * pointCount;

  let x0 = xValues[pairIndex];
  let x1 = xValues[pairIndex + 1u];
  let y0 = yValues[yOffset + pairIndex];
  let y1 = yValues[yOffset + pairIndex + 1u];
  let color = seriesColors[seriesIndex];

  if (y0 != y0 || y1 != y1 || color.a <= 0.0) {
    return gapOutput(color);
  }

  var pointA = vec2<f32>(x0, y0);
  var pointB = vec2<f32>(x1, y1);
  if (segmentsPerPair == 2u) {
    if (stepSegment == 0u) {
      pointB = vec2<f32>(x1, y0);
    } else {
      pointA = vec2<f32>(x1, y0);
    }
  }

  let screenA = toScreen(pointA);
  let screenB = toScreen(pointB);
  let delta = screenB - screenA;
  let lengthPixels = length(delta);
  if (lengthPixels < 1e-6) {
    return gapOutput(color);
  }

  let quad = quadCoordinates(vertexIndex);
  let perpendicular = vec2<f32>(delta.y, -delta.x) / lengthPixels;
  let width = max(1.0, uniforms.canvas.z);
  let halfExtent = width * 0.5 + AA_PADDING;
  let side = mix(1.0, -1.0, quad.y);
  let screenPosition = mix(screenA, screenB, quad.x) + perpendicular * halfExtent * side;
  let clipX = screenPosition.x / uniforms.canvas.x * 2.0 - 1.0;
  let clipY = 1.0 - screenPosition.y / uniforms.canvas.y * 2.0;

  var output: VertexOutput;
  output.position = vec4<f32>(clipX, clipY, 0.0, 1.0);
  output.across = halfExtent * (1.0 + side);
  output.width = width;
  output.color = color;
  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  let totalExtent = input.width + 2.0 * AA_PADDING;
  let nominalDistance = min(
    input.across - AA_PADDING,
    AA_PADDING + input.width - input.across,
  );
  let antialias = max(fwidth(input.across), 1e-3) * 1.25;
  let coverage = smoothstep(0.0, antialias, nominalDistance);
  return vec4<f32>(input.color.rgb, input.color.a * coverage);
}
`
