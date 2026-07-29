export default `
// Matches Canvas2D fillRect/strokeRect subpixel edge composition.
const CANVAS_STROKE_COVERAGE: f32 = 1.17;

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
  @location(1) @interpolate(flat) strokeColor: vec4<f32>,
  @location(2) local: vec2<f32>,
  @location(3) @interpolate(flat) size: vec2<f32>,
  @location(4) @interpolate(flat) strokeWidth: f32,
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

@vertex
fn vertexMain(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32,
) -> VertexOutput {
  let pointCount = uniforms.counts.x;
  let seriesIndex = instanceIndex / pointCount;
  let pointIndex = instanceIndex % pointCount;
  let isMultiBar = uniforms.fill.z > 1.5;
  var offset = pointIndex * uniforms.counts.y + seriesIndex;
  var colorOffset = seriesIndex * 2u;
  if (isMultiBar) {
    offset = seriesIndex * pointCount + pointIndex;
    colorOffset = seriesIndex * 3u;
  }
  let end = yValues[offset];
  var base = baseValues[offset];
  let color = seriesColors[colorOffset];
  let strokeColor = seriesColors[colorOffset + 1u];
  var visibleRank = 0.0;
  var visibleCount = 1.0;
  if (isMultiBar) {
    base = uniforms.fill.y;
    let metadata = seriesColors[colorOffset + 2u];
    visibleRank = metadata.x;
    visibleCount = metadata.y;
  }

  var output: VertexOutput;
  if (
    end != end || base != base || color.a <= 0.0 ||
    visibleRank < 0.0 || visibleCount <= 0.0
  ) {
    output.position = vec4<f32>(0.0, 0.0, 0.0, 0.0);
    output.color = color;
    output.strokeColor = strokeColor;
    output.local = vec2<f32>(0.0);
    output.size = vec2<f32>(0.0);
    output.strokeWidth = 0.0;
    return output;
  }

  let center = toScreen(vec2<f32>(xValues[pointIndex], end));
  let baseY = toScreen(vec2<f32>(xValues[pointIndex], base)).y;
  var barWidth = uniforms.fill.x;
  var xLeft = center.x - barWidth * 0.5;
  if (isMultiBar) {
    let rankDenominator = select(1.0, visibleCount - 1.0, visibleCount > 1.0);
    xLeft = center.x - uniforms.fill.x * 0.5 *
      (1.0 - visibleRank / rankDenominator);
    barWidth = uniforms.fill.x / visibleCount;
  }
  let strokeWidth = max(0.0, uniforms.canvas.z);
  let fillOrigin = vec2<f32>(xLeft, min(center.y, baseY));
  let fillSize = vec2<f32>(barWidth, abs(center.y - baseY));
  let antialiasPadding = vec2<f32>(select(0.0, 0.5, isMultiBar), 0.5);
  let outerOrigin =
    fillOrigin - vec2<f32>(strokeWidth * 0.5) - antialiasPadding;
  let outerSize =
    fillSize + vec2<f32>(strokeWidth) + antialiasPadding * 2.0;
  let quad = quadCoordinates(vertexIndex);
  let point = outerOrigin + quad * outerSize;

  output.position = vec4<f32>(
    point.x / uniforms.canvas.x * 2.0 - 1.0,
    1.0 - point.y / uniforms.canvas.y * 2.0,
    0.0,
    1.0
  );
  output.color = color;
  output.strokeColor = strokeColor;
  output.local =
    quad * outerSize - vec2<f32>(strokeWidth * 0.5) - antialiasPadding;
  output.size = fillSize;
  output.strokeWidth = strokeWidth;
  return output;
}

fn axisCoverage(center: f32, minimum: f32, maximum: f32) -> f32 {
  return clamp(min(center + 0.5, maximum) - max(center - 0.5, minimum), 0.0, 1.0);
}

fn rectCoverage(point: vec2<f32>, minimum: vec2<f32>, maximum: vec2<f32>) -> f32 {
  if (maximum.x <= minimum.x || maximum.y <= minimum.y) {
    return 0.0;
  }
  return axisCoverage(point.x, minimum.x, maximum.x) *
    axisCoverage(point.y, minimum.y, maximum.y);
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  let fillCoverage = rectCoverage(input.local, vec2<f32>(0.0), input.size);
  let halfStroke = input.strokeWidth * 0.5;
  let outerCoverage = rectCoverage(
    input.local,
    vec2<f32>(-halfStroke),
    input.size + vec2<f32>(halfStroke)
  );
  let innerCoverage = rectCoverage(
    input.local,
    vec2<f32>(halfStroke),
    input.size - vec2<f32>(halfStroke)
  );
  let strokeCoverage = clamp(
    (outerCoverage - innerCoverage) * CANVAS_STROKE_COVERAGE,
    0.0,
    1.0
  );
  let fillAlpha = input.color.a * fillCoverage * (1.0 - strokeCoverage);
  let alpha = strokeCoverage + fillAlpha;
  if (alpha <= 0.0) {
    discard;
  }
  let premultiplied =
    input.strokeColor.rgb * strokeCoverage + input.color.rgb * fillAlpha;
  return vec4<f32>(premultiplied / alpha, alpha);
}
`
