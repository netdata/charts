export default `
const TAU: f32 = 6.283185307179586;
const MAX_SEGMENTS: u32 = 6u;

struct Segment {
  geometry: vec4<f32>,
  color: vec4<f32>,
};

struct Uniforms {
  canvas: vec4<f32>,
  geometry: vec4<f32>,
  strokeColor: vec4<f32>,
  segments: array<Segment, 6>,
};

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) point: vec2<f32>,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

fn quadCoordinates(vertexIndex: u32) -> vec2<f32> {
  if (vertexIndex == 0u) { return vec2<f32>(0.0, 0.0); }
  if (vertexIndex == 1u) { return vec2<f32>(1.0, 0.0); }
  if (vertexIndex == 2u) { return vec2<f32>(0.0, 1.0); }
  return vec2<f32>(1.0, 1.0);
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

fn bandCoverage(distance: f32, halfWidth: f32) -> f32 {
  return clamp(halfWidth + 0.5 - distance, 0.0, 1.0);
}

fn rayCoverage(point: vec2<f32>, angle: f32, halfWidth: f32) -> f32 {
  let direction = vec2<f32>(sin(angle), -cos(angle));
  let projection = dot(point, direction);
  let distance = abs(direction.x * point.y - direction.y * point.x);
  let radial = intervalCoverage(projection, uniforms.geometry.x, uniforms.geometry.y);
  return bandCoverage(distance, halfWidth) * radial;
}

fn sourceOver(top: vec4<f32>, bottom: vec4<f32>) -> vec4<f32> {
  let alpha = top.a + bottom.a * (1.0 - top.a);
  if (alpha <= 0.0) { return vec4<f32>(0.0); }
  let rgb = top.rgb * top.a + bottom.rgb * bottom.a * (1.0 - top.a);
  return vec4<f32>(rgb / alpha, alpha);
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  let segmentCount = u32(uniforms.geometry.w);
  let halfStroke = uniforms.geometry.z * 0.5;
  var output = vec4<f32>(0.0);

  for (var index = 0u; index < MAX_SEGMENTS; index += 1u) {
    if (index >= segmentCount) { break; }
    let segment = uniforms.segments[index];
    let point = input.point - segment.geometry.zw;
    let radius = length(point);
    let angle = normalizedAngle(atan2(point.x, -point.y));
    let angular = intervalCoverage(
      angle * radius,
      segment.geometry.x * radius,
      segment.geometry.y * radius
    );
    let radial = intervalCoverage(radius, uniforms.geometry.x, uniforms.geometry.y);
    let fillCoverage = radial * angular;
    var strokeCoverage = max(
      bandCoverage(abs(radius - uniforms.geometry.x), halfStroke),
      bandCoverage(abs(radius - uniforms.geometry.y), halfStroke)
    ) * angular;
    if (segmentCount > 1u) {
      strokeCoverage = max(
        strokeCoverage,
        max(
          rayCoverage(point, segment.geometry.x, halfStroke),
          rayCoverage(point, segment.geometry.y, halfStroke)
        )
      );
    }
    let fill = vec4<f32>(segment.color.rgb, segment.color.a * fillCoverage);
    let stroke = vec4<f32>(uniforms.strokeColor.rgb, uniforms.strokeColor.a * strokeCoverage);
    output = sourceOver(sourceOver(stroke, fill), output);
  }

  return output;
}
`
