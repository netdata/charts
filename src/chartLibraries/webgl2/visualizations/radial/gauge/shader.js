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
const float TAU = 6.283185307179586;
uniform vec4 uGeometry;
uniform vec4 uAngles;
uniform vec4 uPointer;
uniform vec4 uProgressStartColor;
uniform vec4 uProgressEndColor;
uniform vec4 uTrackColor;
uniform vec4 uPointerColor;
in vec2 vPoint;
out vec4 outputColor;

float normalizedAngle(float angle) {
  return angle - floor(angle / TAU) * TAU;
}
float intervalCoverage(float value, float minimum, float maximum) {
  if (maximum <= minimum) return 0.0;
  return clamp(min(value + 0.5, maximum) - max(value - 0.5, minimum), 0.0, 1.0);
}
vec2 arcCoverage(vec2 point, float start, float sweep) {
  float radius = length(point);
  float radial = intervalCoverage(
    radius,
    uGeometry.z - uGeometry.w * 0.5,
    uGeometry.z + uGeometry.w * 0.5
  );
  float relative = normalizedAngle(atan(point.y, point.x) - start);
  float along = relative * uGeometry.z;
  float angular = intervalCoverage(along, 0.0, sweep * uGeometry.z);
  return vec2(radial * angular, clamp(relative / max(sweep, 1e-20), 0.0, 1.0));
}
float cross2(vec2 a, vec2 b) { return a.x * b.y - a.y * b.x; }
float triangleCoverage(vec2 point, vec2 a, vec2 b, vec2 c) {
  float orientation = cross2(b - a, c - a) >= 0.0 ? 1.0 : -1.0;
  vec2 ab = b - a;
  vec2 bc = c - b;
  vec2 ca = a - c;
  float d0 = orientation * cross2(ab, point - a) / max(length(ab), 1e-20);
  float d1 = orientation * cross2(bc, point - b) / max(length(bc), 1e-20);
  float d2 = orientation * cross2(ca, point - c) / max(length(ca), 1e-20);
  return clamp(min(d0, min(d1, d2)) + 0.5, 0.0, 1.0);
}
vec4 sourceOver(vec4 top, vec4 bottom) {
  float alpha = top.a + bottom.a * (1.0 - top.a);
  if (alpha <= 0.0) return vec4(0.0);
  vec3 rgb = top.rgb * top.a + bottom.rgb * bottom.a * (1.0 - top.a);
  return vec4(rgb / alpha, alpha);
}
void main() {
  vec2 progress = arcCoverage(vPoint, uAngles.x, uAngles.z);
  vec2 remaining = arcCoverage(vPoint, uAngles.x + uAngles.z, uAngles.y - uAngles.z);
  vec4 progressColor = mix(
    uProgressStartColor,
    uProgressEndColor,
    uPointer.z > 0.5 ? progress.y : 1.0
  );
  vec4 track = vec4(uTrackColor.rgb, uTrackColor.a * remaining.x);
  vec4 bar = vec4(progressColor.rgb, progressColor.a * progress.x);
  vec2 direction = vec2(cos(uAngles.w), sin(uAngles.w));
  vec2 perpendicular = vec2(-direction.y, direction.x);
  vec2 a = perpendicular * uPointer.y;
  vec2 b = direction * uPointer.x;
  vec2 c = -perpendicular * uPointer.y;
  float triangle = triangleCoverage(vPoint, a, b, c);
  float center = clamp(uPointer.y + 0.5 - length(vPoint), 0.0, 1.0);
  float pointerCoverage = max(triangle, center);
  vec4 pointer = vec4(uPointerColor.rgb, uPointerColor.a * pointerCoverage);
  outputColor = sourceOver(pointer, sourceOver(bar, track));
}
`
