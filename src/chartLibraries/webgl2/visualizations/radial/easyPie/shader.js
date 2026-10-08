export const vertexShader = `#version 300 es
precision highp float;

uniform vec4 uCanvas;
out vec2 vPoint;

vec2 quadCoordinates(int vertexIndex) {
  if (vertexIndex == 0) return vec2(0.0, 0.0);
  if (vertexIndex == 1) return vec2(1.0, 0.0);
  if (vertexIndex == 2) return vec2(0.0, 1.0);
  return vec2(1.0, 1.0);
}

void main() {
  vec2 quad = quadCoordinates(gl_VertexID);
  gl_Position = vec4(quad.x * 2.0 - 1.0, 1.0 - quad.y * 2.0, 0.0, 1.0);
  vPoint = quad * uCanvas.xy - uCanvas.zw;
}
`

export const fragmentShader = `#version 300 es
precision highp float;
precision highp int;

const float PI = 3.141592653589793;
const float TAU = 6.283185307179586;

uniform vec4 uGeometry;
uniform vec4 uValues;
uniform vec4 uBarColor;
uniform vec4 uTrackColor;
uniform vec4 uScaleColor;

in vec2 vPoint;
out vec4 outputColor;

float intervalCoverage(float value, float minimum, float maximum) {
  return clamp(min(value + 0.5, maximum) - max(value - 0.5, minimum), 0.0, 1.0);
}

float ringCoverage(float radius, float centerRadius, float lineWidth) {
  float halfWidth = lineWidth * 0.5;
  return intervalCoverage(radius, centerRadius - halfWidth, centerRadius + halfWidth);
}

float normalizedAngle(float angle) {
  return angle - floor(angle / TAU) * TAU;
}

float arcCoverage(vec2 point, float radius, float lineWidth, float sweep) {
  float absoluteSweep = abs(sweep);
  if (absoluteSweep < 1e-7) return 0.0;
  if (absoluteSweep >= TAU - 1e-5) return ringCoverage(length(point), radius, lineWidth);

  float start = -PI * 0.5;
  float angle = atan(point.y, point.x);
  float forward = normalizedAngle(angle - start);
  float backward = normalizedAngle(start - angle);
  bool inside = sweep > 0.0 ? forward <= absoluteSweep : backward <= absoluteSweep;
  float end = start + sweep;
  vec2 startPoint = vec2(cos(start), sin(start)) * radius;
  vec2 endPoint = vec2(cos(end), sin(end)) * radius;
  float distance = inside
    ? abs(length(point) - radius)
    : min(length(point - startPoint), length(point - endPoint));
  return clamp(lineWidth * 0.5 + 0.5 - distance, 0.0, 1.0);
}

float scaleCoverage(vec2 point) {
  if (uValues.y < 0.5 || uGeometry.w <= 0.0) return 0.0;

  float angle = atan(point.y, point.x);
  float step = PI / 12.0;
  float tick = round((angle - PI * 0.5) / step);
  float tickAngle = PI * 0.5 + tick * step;
  vec2 direction = vec2(cos(tickAngle), sin(tickAngle));
  vec2 tangent = vec2(-direction.y, direction.x);
  float radial = dot(point, direction);
  float across = dot(point, tangent);
  bool major = abs(int(tick)) % 6 == 0;
  float tickLength = major ? uGeometry.w : uGeometry.w * 0.6;
  float offset = uGeometry.w - tickLength;
  float halfSize = uGeometry.x * 0.5;
  return intervalCoverage(radial, halfSize - uGeometry.w, halfSize - offset) *
    intervalCoverage(across, 0.0, uValues.w);
}

vec4 coveredColor(vec4 color, float coverage) {
  return vec4(color.rgb, color.a * coverage);
}

vec4 sourceOver(vec4 top, vec4 bottom) {
  float alpha = top.a + bottom.a * (1.0 - top.a);
  if (alpha <= 0.0) return vec4(0.0);
  vec3 premultiplied = top.rgb * top.a + bottom.rgb * bottom.a * (1.0 - top.a);
  return vec4(premultiplied / alpha, alpha);
}

void main() {
  float distance = length(vPoint);
  vec4 scale = coveredColor(uScaleColor, scaleCoverage(vPoint));
  float trackCoverage = uValues.z > 0.5
    ? ringCoverage(distance, uGeometry.y, uGeometry.z)
    : 0.0;
  vec4 track = coveredColor(uTrackColor, trackCoverage);
  vec4 bar = coveredColor(
    uBarColor,
    arcCoverage(vPoint, uGeometry.y, uGeometry.z, uValues.x * TAU)
  );
  outputColor = sourceOver(bar, sourceOver(track, scale));
}
`
