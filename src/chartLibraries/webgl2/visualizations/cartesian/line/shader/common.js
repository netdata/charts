export const vertexCommon = `#version 300 es
precision highp float;
precision highp int;

const float AA_PADDING = 1.0;
const float SMOOTH_ALPHA = 0.3333333333333333;
const uint MODE_STEP = 1u;
const uint MODE_SMOOTH = 2u;

layout(location = 0) in vec4 instanceGeometry;
layout(location = 1) in vec4 instanceUv;
layout(location = 2) in vec4 instanceColor;
layout(location = 3) in vec4 instanceKind;
uniform int uPassType;
uniform sampler2D uXValues;
uniform sampler2D uYValues;
uniform sampler2D uSeriesColors;
uniform sampler2D uBaseValues;
uniform ivec2 uXTextureSize;
uniform ivec2 uYTextureSize;
uniform ivec2 uColorTextureSize;
uniform ivec2 uBaseTextureSize;
uniform vec4 uDomain;
uniform vec4 uPlot;
uniform vec4 uCanvas;
uniform vec3 uFill;
uniform uvec4 uCounts;

out float vAcross;
out vec2 vLocal;
out vec2 vUv;
flat out float vWidth;
flat out float vKind;
flat out vec4 vColor;
flat out vec4 vStrokeColor;

struct SmoothControls {
  vec2 left;
  vec2 right;
};

ivec2 linearCoordinate(int index, ivec2 size) {
  return ivec2(index % size.x, index / size.x);
}

float loadValue(sampler2D source, ivec2 size, int index) {
  return texelFetch(source, linearCoordinate(index, size), 0).r;
}

vec4 loadColor(int index) {
  return texelFetch(uSeriesColors, linearCoordinate(index, uColorTextureSize), 0);
}

int valueIndex(uint seriesIndex, uint pointIndex) {
  if (uFill.z > 0.5 && uFill.z < 1.5) {
    return int(pointIndex * uCounts.y + seriesIndex);
  }
  return int(seriesIndex * uCounts.x + pointIndex);
}

vec2 quadCoordinates(int vertexIndex) {
  if (vertexIndex == 0) return vec2(0.0, 0.0);
  if (vertexIndex == 1) return vec2(1.0, 0.0);
  if (vertexIndex == 2 || vertexIndex == 3) return vec2(0.0, 1.0);
  if (vertexIndex == 4) return vec2(1.0, 0.0);
  return vec2(1.0, 1.0);
}

vec2 toScreen(vec2 point) {
  float xRange = max(uDomain.y - uDomain.x, 1e-20);
  float yRange = max(uDomain.w - uDomain.z, 1e-20);
  float x = uPlot.x + ((point.x - uDomain.x) / xRange) * uPlot.z;
  float y = uPlot.y + (1.0 - (point.y - uDomain.z) / yRange) * uPlot.w;
  return vec2(x, y);
}

vec2 loadScreenPoint(uint seriesIndex, uint pointIndex) {
  float x = loadValue(uXValues, uXTextureSize, int(pointIndex));
  float y = loadValue(uYValues, uYTextureSize, valueIndex(seriesIndex, pointIndex));
  return toScreen(vec2(x, y));
}

bool validScreenPoint(vec2 point) {
  return !isnan(point.y);
}

SmoothControls smoothControls(uint seriesIndex, uint pointIndex) {
  vec2 point = loadScreenPoint(seriesIndex, pointIndex);
  SmoothControls controls;
  controls.left = point;
  controls.right = point;
  if (pointIndex == 0u || pointIndex + 1u >= uCounts.x) return controls;

  vec2 previous = loadScreenPoint(seriesIndex, pointIndex - 1u);
  vec2 next = loadScreenPoint(seriesIndex, pointIndex + 1u);
  if (!validScreenPoint(previous) || !validScreenPoint(point) || !validScreenPoint(next)) {
    return controls;
  }

  vec2 left = (1.0 - SMOOTH_ALPHA) * point + SMOOTH_ALPHA * previous;
  vec2 right = (1.0 - SMOOTH_ALPHA) * point + SMOOTH_ALPHA * next;
  if (left.x != right.x) {
    float deltaY = point.y - right.y - ((point.x - right.x) * (left.y - right.y)) /
      (left.x - right.x);
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

vec2 cubicPoint(vec2 a, vec2 c1, vec2 c2, vec2 b, float t) {
  vec2 q0 = mix(a, c1, t);
  vec2 q1 = mix(c1, c2, t);
  vec2 q2 = mix(c2, b, t);
  return mix(mix(q0, q1, t), mix(q1, q2, t), t);
}
`
