export default `
const AA_PADDING: f32 = 1.0;
const SMOOTH_ALPHA: f32 = 0.3333333333333333;
const MODE_STEP: u32 = 1u;
const MODE_SMOOTH: u32 = 2u;

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

struct SmoothControls {
  left: vec2<f32>,
  right: vec2<f32>,
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

fn loadScreenPoint(seriesIndex: u32, pointIndex: u32) -> vec2<f32> {
  let yOffset = seriesIndex * uniforms.counts.x;
  return toScreen(vec2<f32>(xValues[pointIndex], yValues[yOffset + pointIndex]));
}

fn validScreenPoint(point: vec2<f32>) -> bool {
  return point.y == point.y && point.y != 0.0;
}

fn smoothControls(seriesIndex: u32, pointIndex: u32) -> SmoothControls {
  let point = loadScreenPoint(seriesIndex, pointIndex);
  var controls: SmoothControls;
  controls.left = point;
  controls.right = point;
  if (pointIndex == 0u || pointIndex + 1u >= uniforms.counts.x) {
    return controls;
  }

  let previous = loadScreenPoint(seriesIndex, pointIndex - 1u);
  if (!validScreenPoint(previous) || !validScreenPoint(point)) {
    return controls;
  }
  let next = loadScreenPoint(seriesIndex, pointIndex + 1u);
  if (!validScreenPoint(next)) {
    return controls;
  }

  var left = (1.0 - SMOOTH_ALPHA) * point + SMOOTH_ALPHA * previous;
  var right = (1.0 - SMOOTH_ALPHA) * point + SMOOTH_ALPHA * next;
  if (left.x != right.x) {
    let deltaY = point.y - right.y - ((point.x - right.x) * (left.y - right.y)) / (left.x - right.x);
    left.y += deltaY;
    right.y += deltaY;
  }

  if (left.y > previous.y && left.y > point.y) {
    left.y = max(previous.y, point.y);
    right.y = 2.0 * point.y - left.y;
  } else if (left.y < previous.y && left.y < point.y) {
    left.y = min(previous.y, point.y);
    right.y = 2.0 * point.y - left.y;
  }

  if (right.y > point.y && right.y > next.y) {
    right.y = max(point.y, next.y);
    left.y = 2.0 * point.y - right.y;
  } else if (right.y < point.y && right.y < next.y) {
    right.y = min(point.y, next.y);
    left.y = 2.0 * point.y - right.y;
  }

  controls.left = left;
  controls.right = right;
  return controls;
}

fn cubicPoint(a: vec2<f32>, c1: vec2<f32>, c2: vec2<f32>, b: vec2<f32>, t: f32) -> vec2<f32> {
  let q0 = mix(a, c1, t);
  let q1 = mix(c1, c2, t);
  let q2 = mix(c2, b, t);
  return mix(mix(q0, q1, t), mix(q1, q2, t), t);
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
  let pairSegment = localSegment % segmentsPerPair;
  let yOffset = seriesIndex * pointCount;
  let mode = u32(uniforms.canvas.w);

  let x0 = xValues[pairIndex];
  let x1 = xValues[pairIndex + 1u];
  let y0 = yValues[yOffset + pairIndex];
  let y1 = yValues[yOffset + pairIndex + 1u];
  let color = seriesColors[seriesIndex];
  let sourceA = toScreen(vec2<f32>(x0, y0));
  let sourceB = toScreen(vec2<f32>(x1, y1));

  if (y0 != y0 || y1 != y1 || color.a <= 0.0) {
    return gapOutput(color);
  }
  if (mode == MODE_SMOOTH && (!validScreenPoint(sourceA) || !validScreenPoint(sourceB))) {
    return gapOutput(color);
  }

  var screenA = sourceA;
  var screenB = sourceB;
  if (mode == MODE_STEP) {
    if (pairSegment == 0u) {
      screenB = vec2<f32>(sourceB.x, sourceA.y);
    } else {
      screenA = vec2<f32>(sourceB.x, sourceA.y);
    }
  } else if (mode == MODE_SMOOTH && segmentsPerPair > 1u) {
    let controlsA = smoothControls(seriesIndex, pairIndex);
    let controlsB = smoothControls(seriesIndex, pairIndex + 1u);
    let t0 = f32(pairSegment) / f32(segmentsPerPair);
    let t1 = f32(pairSegment + 1u) / f32(segmentsPerPair);
    screenA = cubicPoint(sourceA, controlsA.right, controlsB.left, sourceB, t0);
    screenB = cubicPoint(sourceA, controlsA.right, controlsB.left, sourceB, t1);
  }

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
  let center = input.width * 0.5 + AA_PADDING;
  let distance = abs(input.across - center);
  let antialias = max(fwidth(input.across), 1e-3) * 0.75;
  let inner = max(0.0, input.width * 0.5 - antialias);
  let outer = input.width * 0.5 + antialias;
  let coverage = 1.0 - smoothstep(inner, outer, distance);
  return vec4<f32>(input.color.rgb, input.color.a * coverage);
}
`
