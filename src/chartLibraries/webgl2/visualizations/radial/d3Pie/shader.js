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
const int MAX_SEGMENTS = 6;
uniform vec4 uGeometry;
uniform vec4 uStrokeColor;
uniform vec4 uSegmentGeometry[MAX_SEGMENTS];
uniform vec4 uSegmentColors[MAX_SEGMENTS];
in vec2 vPoint;
out vec4 outputColor;

float normalizedAngle(float angle) {
  return angle - floor(angle / TAU) * TAU;
}
float intervalCoverage(float value, float minimum, float maximum) {
  if (maximum <= minimum) return 0.0;
  return clamp(min(value + 0.5, maximum) - max(value - 0.5, minimum), 0.0, 1.0);
}
float bandCoverage(float distance, float halfWidth) {
  return clamp(halfWidth + 0.5 - distance, 0.0, 1.0);
}
float rayCoverage(vec2 point, float angle, float halfWidth) {
  vec2 direction = vec2(sin(angle), -cos(angle));
  float projection = dot(point, direction);
  float distance = abs(direction.x * point.y - direction.y * point.x);
  float radial = intervalCoverage(projection, uGeometry.x, uGeometry.y);
  return bandCoverage(distance, halfWidth) * radial;
}
vec4 sourceOver(vec4 top, vec4 bottom) {
  float alpha = top.a + bottom.a * (1.0 - top.a);
  if (alpha <= 0.0) return vec4(0.0);
  vec3 rgb = top.rgb * top.a + bottom.rgb * bottom.a * (1.0 - top.a);
  return vec4(rgb / alpha, alpha);
}
void main() {
  int segmentCount = int(uGeometry.w);
  float halfStroke = uGeometry.z * 0.5;
  vec4 result = vec4(0.0);
  for (int index = 0; index < MAX_SEGMENTS; index++) {
    if (index >= segmentCount) break;
    vec4 segment = uSegmentGeometry[index];
    vec2 point = vPoint - segment.zw;
    float radius = length(point);
    float angle = normalizedAngle(atan(point.x, -point.y));
    float angular = intervalCoverage(angle * radius, segment.x * radius, segment.y * radius);
    float radial = intervalCoverage(radius, uGeometry.x, uGeometry.y);
    float fillCoverage = radial * angular;
    float strokeCoverage = max(
      bandCoverage(abs(radius - uGeometry.x), halfStroke),
      bandCoverage(abs(radius - uGeometry.y), halfStroke)
    ) * angular;
    if (segmentCount > 1) {
      strokeCoverage = max(
        strokeCoverage,
        max(
          rayCoverage(point, segment.x, halfStroke),
          rayCoverage(point, segment.y, halfStroke)
        )
      );
    }
    vec4 fill = vec4(uSegmentColors[index].rgb, uSegmentColors[index].a * fillCoverage);
    vec4 stroke = vec4(uStrokeColor.rgb, uStrokeColor.a * strokeCoverage);
    result = sourceOver(sourceOver(stroke, fill), result);
  }
  outputColor = result;
}
`
