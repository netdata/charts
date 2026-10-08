export default `
const PI: f32 = 3.141592653589793;
const TAU: f32 = 6.283185307179586;

struct Uniforms {
  canvas: vec4<f32>,
  geometry: vec4<f32>,
  values: vec4<f32>,
  barColor: vec4<f32>,
  trackColor: vec4<f32>,
  scaleColor: vec4<f32>,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) point: vec2<f32>,
};

fn quadCoordinates(vertexIndex: u32) -> vec2<f32> {
  switch vertexIndex {
    case 0u: { return vec2<f32>(0.0, 0.0); }
    case 1u: { return vec2<f32>(1.0, 0.0); }
    case 2u: { return vec2<f32>(0.0, 1.0); }
    default: { return vec2<f32>(1.0, 1.0); }
  }
}

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
  let quad = quadCoordinates(vertexIndex);
  var output: VertexOutput;
  output.position = vec4<f32>(quad.x * 2.0 - 1.0, 1.0 - quad.y * 2.0, 0.0, 1.0);
  output.point = quad * uniforms.canvas.xy - uniforms.canvas.zw;
  return output;
}

fn intervalCoverage(value: f32, minimum: f32, maximum: f32) -> f32 {
  return clamp(min(value + 0.5, maximum) - max(value - 0.5, minimum), 0.0, 1.0);
}

fn ringCoverage(radius: f32, centerRadius: f32, lineWidth: f32) -> f32 {
  let halfWidth = lineWidth * 0.5;
  return intervalCoverage(radius, centerRadius - halfWidth, centerRadius + halfWidth);
}

fn normalizedAngle(angle: f32) -> f32 {
  return angle - floor(angle / TAU) * TAU;
}

fn arcCoverage(point: vec2<f32>, radius: f32, lineWidth: f32, sweep: f32) -> f32 {
  let absoluteSweep = abs(sweep);
  if (absoluteSweep < 1e-7) {
    return 0.0;
  }
  if (absoluteSweep >= TAU - 1e-5) {
    return ringCoverage(length(point), radius, lineWidth);
  }

  let start = -PI * 0.5;
  let angle = atan2(point.y, point.x);
  let forward = normalizedAngle(angle - start);
  let backward = normalizedAngle(start - angle);
  let inside = select(backward <= absoluteSweep, forward <= absoluteSweep, sweep > 0.0);
  let end = start + sweep;
  let startPoint = vec2<f32>(cos(start), sin(start)) * radius;
  let endPoint = vec2<f32>(cos(end), sin(end)) * radius;
  let distance = select(
    min(length(point - startPoint), length(point - endPoint)),
    abs(length(point) - radius),
    inside
  );
  return clamp(lineWidth * 0.5 + 0.5 - distance, 0.0, 1.0);
}

fn scaleCoverage(point: vec2<f32>) -> f32 {
  if (uniforms.values.y < 0.5 || uniforms.geometry.w <= 0.0) {
    return 0.0;
  }

  let angle = atan2(point.y, point.x);
  let step = PI / 12.0;
  let tick = round((angle - PI * 0.5) / step);
  let tickAngle = PI * 0.5 + tick * step;
  let direction = vec2<f32>(cos(tickAngle), sin(tickAngle));
  let tangent = vec2<f32>(-direction.y, direction.x);
  let radial = dot(point, direction);
  let across = dot(point, tangent);
  let major = abs(i32(tick)) % 6 == 0;
  let tickLength = select(uniforms.geometry.w * 0.6, uniforms.geometry.w, major);
  let offset = uniforms.geometry.w - tickLength;
  let halfSize = uniforms.geometry.x * 0.5;
  return intervalCoverage(radial, halfSize - uniforms.geometry.w, halfSize - offset) *
    intervalCoverage(across, 0.0, uniforms.values.w);
}

fn coveredColor(color: vec4<f32>, coverage: f32) -> vec4<f32> {
  return vec4<f32>(color.rgb, color.a * coverage);
}

fn sourceOver(top: vec4<f32>, bottom: vec4<f32>) -> vec4<f32> {
  let alpha = top.a + bottom.a * (1.0 - top.a);
  if (alpha <= 0.0) {
    return vec4<f32>(0.0);
  }
  let premultiplied = top.rgb * top.a + bottom.rgb * bottom.a * (1.0 - top.a);
  return vec4<f32>(premultiplied / alpha, alpha);
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  let distance = length(input.point);
  let scale = coveredColor(uniforms.scaleColor, scaleCoverage(input.point));
  let trackCoverage = select(
    0.0,
    ringCoverage(distance, uniforms.geometry.y, uniforms.geometry.z),
    uniforms.values.z > 0.5
  );
  let track = coveredColor(uniforms.trackColor, trackCoverage);
  let bar = coveredColor(
    uniforms.barColor,
    arcCoverage(
      input.point,
      uniforms.geometry.y,
      uniforms.geometry.z,
      uniforms.values.x * TAU
    )
  );
  return sourceOver(bar, sourceOver(track, scale));
}
`
