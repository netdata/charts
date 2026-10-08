export default `
const TAU: f32 = 6.283185307179586;

struct Uniforms {
  canvas: vec4<f32>,
  geometry: vec4<f32>,
  angles: vec4<f32>,
  pointer: vec4<f32>,
  progressStartColor: vec4<f32>,
  progressEndColor: vec4<f32>,
  trackColor: vec4<f32>,
  pointerColor: vec4<f32>,
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

fn normalizedAngle(angle: f32) -> f32 {
  return angle - floor(angle / TAU) * TAU;
}

fn intervalCoverage(value: f32, minimum: f32, maximum: f32) -> f32 {
  if (maximum <= minimum) { return 0.0; }
  return clamp(min(value + 0.5, maximum) - max(value - 0.5, minimum), 0.0, 1.0);
}

fn arcCoverage(point: vec2<f32>, start: f32, sweep: f32) -> vec2<f32> {
  let radius = length(point);
  let radial = intervalCoverage(
    radius,
    uniforms.geometry.z - uniforms.geometry.w * 0.5,
    uniforms.geometry.z + uniforms.geometry.w * 0.5
  );
  let relative = normalizedAngle(atan2(point.y, point.x) - start);
  let along = relative * uniforms.geometry.z;
  let angular = intervalCoverage(along, 0.0, sweep * uniforms.geometry.z);
  return vec2<f32>(radial * angular, clamp(relative / max(sweep, 1e-20), 0.0, 1.0));
}

fn triangleCoverage(point: vec2<f32>, a: vec2<f32>, b: vec2<f32>, c: vec2<f32>) -> f32 {
  let orientation = select(-1.0, 1.0, (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x) >= 0.0);
  let ab = b - a;
  let bc = c - b;
  let ca = a - c;
  let d0 = orientation * (ab.x * (point.y - a.y) - ab.y * (point.x - a.x)) / max(length(ab), 1e-20);
  let d1 = orientation * (bc.x * (point.y - b.y) - bc.y * (point.x - b.x)) / max(length(bc), 1e-20);
  let d2 = orientation * (ca.x * (point.y - c.y) - ca.y * (point.x - c.x)) / max(length(ca), 1e-20);
  return clamp(min(d0, min(d1, d2)) + 0.5, 0.0, 1.0);
}

fn sourceOver(top: vec4<f32>, bottom: vec4<f32>) -> vec4<f32> {
  let alpha = top.a + bottom.a * (1.0 - top.a);
  if (alpha <= 0.0) { return vec4<f32>(0.0); }
  let rgb = top.rgb * top.a + bottom.rgb * bottom.a * (1.0 - top.a);
  return vec4<f32>(rgb / alpha, alpha);
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  let progress = arcCoverage(input.point, uniforms.angles.x, uniforms.angles.z);
  let remaining = arcCoverage(
    input.point,
    uniforms.angles.x + uniforms.angles.z,
    uniforms.angles.y - uniforms.angles.z
  );
  let progressColor = mix(
    uniforms.progressStartColor,
    uniforms.progressEndColor,
    select(1.0, progress.y, uniforms.pointer.z > 0.5)
  );
  let track = vec4<f32>(uniforms.trackColor.rgb, uniforms.trackColor.a * remaining.x);
  let bar = vec4<f32>(progressColor.rgb, progressColor.a * progress.x);

  let direction = vec2<f32>(cos(uniforms.angles.w), sin(uniforms.angles.w));
  let perpendicular = vec2<f32>(-direction.y, direction.x);
  let a = perpendicular * uniforms.pointer.y;
  let b = direction * uniforms.pointer.x;
  let c = -perpendicular * uniforms.pointer.y;
  let triangle = triangleCoverage(input.point, a, b, c);
  let center = clamp(uniforms.pointer.y + 0.5 - length(input.point), 0.0, 1.0);
  let pointerCoverage = max(triangle, center);
  let pointer = vec4<f32>(
    uniforms.pointerColor.rgb,
    uniforms.pointerColor.a * pointerCoverage
  );
  return sourceOver(pointer, sourceOver(bar, track));
}
`
