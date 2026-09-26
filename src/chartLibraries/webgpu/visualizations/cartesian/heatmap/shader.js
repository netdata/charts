export default `
const HEATMAP_COLORS = array<vec3<f32>, 7>(
  vec3<f32>(62.0, 73.0, 137.0) / 255.0,
  vec3<f32>(49.0, 104.0, 142.0) / 255.0,
  vec3<f32>(38.0, 130.0, 142.0) / 255.0,
  vec3<f32>(31.0, 158.0, 137.0) / 255.0,
  vec3<f32>(53.0, 183.0, 121.0) / 255.0,
  vec3<f32>(110.0, 206.0, 88.0) / 255.0,
  vec3<f32>(181.0, 222.0, 43.0) / 255.0
);

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
@group(0) @binding(3) var<storage, read> seriesMetadata: array<vec4<f32>>;

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) @interpolate(flat) color: vec4<f32>,
  @location(1) local: vec2<f32>,
  @location(2) @interpolate(flat) size: vec2<f32>,
};

fn quadCoordinates(vertexIndex: u32) -> vec2<f32> {
  switch vertexIndex {
    case 0u: { return vec2<f32>(0.0, 0.0); }
    case 1u: { return vec2<f32>(1.0, 0.0); }
    case 2u: { return vec2<f32>(0.0, 1.0); }
    default: { return vec2<f32>(1.0, 1.0); }
  }
}

fn toScreen(point: vec2<f32>) -> vec2<f32> {
  let xRange = max(uniforms.domain.y - uniforms.domain.x, 1e-20);
  let yRange = max(uniforms.domain.w - uniforms.domain.z, 1e-20);
  return vec2<f32>(
    uniforms.plot.x + ((point.x - uniforms.domain.x) / xRange) * uniforms.plot.z,
    uniforms.plot.y + (1.0 - (point.y - uniforms.domain.z) / yRange) * uniforms.plot.w
  );
}

fn heatmapColor(value: f32, maximum: f32) -> vec4<f32> {
  if (value == 0.0) {
    return vec4<f32>(0.0);
  }
  if (maximum != maximum || maximum <= 0.0) {
    return vec4<f32>(HEATMAP_COLORS[0], 1.0);
  }
  let scaled = value / (maximum / 7.0);
  let segment = clamp(floor(scaled), 0.0, 5.0);
  let rgb = mix(
    HEATMAP_COLORS[u32(segment)],
    HEATMAP_COLORS[u32(segment) + 1u],
    scaled - segment
  );
  let rounded =
    clamp(floor(rgb * 255.0 + 0.5), vec3<f32>(0.0), vec3<f32>(255.0)) / 255.0;
  return vec4<f32>(rounded, 1.0);
}

@vertex
fn vertexMain(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32,
) -> VertexOutput {
  let pointCount = uniforms.counts.x;
  let seriesCount = uniforms.counts.y;
  let seriesIndex = instanceIndex / pointCount;
  let pointIndex = instanceIndex % pointCount;
  let value = yValues[pointIndex * seriesCount + seriesIndex];
  let metadata = seriesMetadata[seriesIndex];
  let color = heatmapColor(value, uniforms.fill.w);

  var output: VertexOutput;
  if (metadata.x < 0.0 || color.a <= 0.0) {
    output.position = vec4<f32>(-2.0, -2.0, 0.0, 1.0);
    output.color = vec4<f32>(0.0);
    output.local = vec2<f32>(0.0);
    output.size = vec2<f32>(0.0);
    return output;
  }

  let center = toScreen(vec2<f32>(xValues[pointIndex], metadata.x));
  let nextRowY = toScreen(vec2<f32>(xValues[pointIndex], metadata.x + 1.0)).y;
  let fillSize = vec2<f32>(uniforms.fill.x, abs(center.y - nextRowY));
  let fillOrigin = vec2<f32>(
    center.x - fillSize.x * 0.5,
    center.y - fillSize.y * 0.5
  );
  let antialiasPadding = vec2<f32>(0.5);
  let outerOrigin = fillOrigin - antialiasPadding;
  let outerSize = fillSize + antialiasPadding * 2.0;
  let quad = quadCoordinates(vertexIndex);
  let point = outerOrigin + quad * outerSize;

  output.position = vec4<f32>(
    point.x / uniforms.canvas.x * 2.0 - 1.0,
    1.0 - point.y / uniforms.canvas.y * 2.0,
    0.0,
    1.0
  );
  output.color = color;
  output.local = quad * outerSize - antialiasPadding;
  output.size = fillSize;
  return output;
}

fn axisCoverage(center: f32, minimum: f32, maximum: f32) -> f32 {
  return clamp(min(center + 0.5, maximum) - max(center - 0.5, minimum), 0.0, 1.0);
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  let coverage =
    axisCoverage(input.local.x, 0.0, input.size.x) *
    axisCoverage(input.local.y, 0.0, input.size.y);
  return vec4<f32>(input.color.rgb, input.color.a * coverage);
}
`
