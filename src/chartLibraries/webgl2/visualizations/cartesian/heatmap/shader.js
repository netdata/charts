export const vertexShader = `#version 300 es
precision highp float;
precision highp int;

const vec3 HEATMAP_COLORS[7] = vec3[7](
  vec3(62.0, 73.0, 137.0) / 255.0,
  vec3(49.0, 104.0, 142.0) / 255.0,
  vec3(38.0, 130.0, 142.0) / 255.0,
  vec3(31.0, 158.0, 137.0) / 255.0,
  vec3(53.0, 183.0, 121.0) / 255.0,
  vec3(110.0, 206.0, 88.0) / 255.0,
  vec3(181.0, 222.0, 43.0) / 255.0
);

uniform sampler2D uXValues;
uniform sampler2D uYValues;
uniform sampler2D uSeriesColors;
uniform ivec2 uXTextureSize;
uniform ivec2 uYTextureSize;
uniform ivec2 uColorTextureSize;
uniform vec4 uDomain;
uniform vec4 uPlot;
uniform vec4 uCanvas;
uniform vec4 uFill;
uniform uvec4 uCounts;

out vec2 vLocal;
flat out vec2 vSize;
flat out vec4 vColor;

ivec2 linearCoordinate(int index, ivec2 size) {
  return ivec2(index % size.x, index / size.x);
}

float loadValue(sampler2D source, ivec2 size, int index) {
  return texelFetch(source, linearCoordinate(index, size), 0).r;
}

vec4 loadMetadata(int index) {
  return texelFetch(
    uSeriesColors,
    linearCoordinate(index, uColorTextureSize),
    0
  );
}

vec2 quadCoordinates(int vertexIndex) {
  if (vertexIndex == 0) return vec2(0.0, 0.0);
  if (vertexIndex == 1) return vec2(1.0, 0.0);
  if (vertexIndex == 2) return vec2(0.0, 1.0);
  return vec2(1.0, 1.0);
}

vec2 toScreen(vec2 point) {
  float xRange = max(uDomain.y - uDomain.x, 1e-20);
  float yRange = max(uDomain.w - uDomain.z, 1e-20);
  return vec2(
    uPlot.x + ((point.x - uDomain.x) / xRange) * uPlot.z,
    uPlot.y + (1.0 - (point.y - uDomain.z) / yRange) * uPlot.w
  );
}

vec4 heatmapColor(float value, float maximum) {
  if (value == 0.0) return vec4(0.0);
  if (isnan(maximum) || maximum <= 0.0) return vec4(HEATMAP_COLORS[0], 1.0);
  float scaled = value / (maximum / 7.0);
  float segment = clamp(floor(scaled), 0.0, 5.0);
  vec3 rgb = mix(
    HEATMAP_COLORS[int(segment)],
    HEATMAP_COLORS[int(segment) + 1],
    scaled - segment
  );
  return vec4(clamp(floor(rgb * 255.0 + 0.5), 0.0, 255.0) / 255.0, 1.0);
}

void main() {
  uint pointCount = uCounts.x;
  uint seriesCount = uCounts.y;
  uint seriesIndex = uint(gl_InstanceID) / pointCount;
  uint pointIndex = uint(gl_InstanceID) % pointCount;
  float value = loadValue(
    uYValues,
    uYTextureSize,
    int(pointIndex * seriesCount + seriesIndex)
  );
  vec4 metadata = loadMetadata(int(seriesIndex));
  vec4 color = heatmapColor(value, uFill.w);

  if (metadata.x < 0.0 || color.a <= 0.0) {
    gl_Position = vec4(-2.0, -2.0, 0.0, 1.0);
    vLocal = vec2(0.0);
    vSize = vec2(0.0);
    vColor = vec4(0.0);
    return;
  }

  float x = loadValue(uXValues, uXTextureSize, int(pointIndex));
  vec2 center = toScreen(vec2(x, metadata.x));
  float nextRowY = toScreen(vec2(x, metadata.x + 1.0)).y;
  vec2 fillSize = vec2(uFill.x, abs(center.y - nextRowY));
  vec2 fillOrigin = center - fillSize * 0.5;
  vec2 antialiasPadding = vec2(0.5);
  vec2 outerOrigin = fillOrigin - antialiasPadding;
  vec2 outerSize = fillSize + antialiasPadding * 2.0;
  vec2 quad = quadCoordinates(gl_VertexID);
  vec2 point = outerOrigin + quad * outerSize;

  gl_Position = vec4(
    point.x / uCanvas.x * 2.0 - 1.0,
    1.0 - point.y / uCanvas.y * 2.0,
    0.0,
    1.0
  );
  vLocal = quad * outerSize - antialiasPadding;
  vSize = fillSize;
  vColor = color;
}
`

export const fragmentShader = `#version 300 es
precision highp float;

in vec2 vLocal;
flat in vec2 vSize;
flat in vec4 vColor;
out vec4 outputColor;

float axisCoverage(float center, float minimum, float maximum) {
  return clamp(min(center + 0.5, maximum) - max(center - 0.5, minimum), 0.0, 1.0);
}

void main() {
  float coverage =
    axisCoverage(vLocal.x, 0.0, vSize.x) *
    axisCoverage(vLocal.y, 0.0, vSize.y);
  if (coverage <= 0.0) discard;
  outputColor = vec4(vColor.rgb, vColor.a * coverage);
}
`
