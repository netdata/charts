export const vertexShader = `#version 300 es
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
uniform ivec2 uXTextureSize;
uniform ivec2 uYTextureSize;
uniform ivec2 uColorTextureSize;
uniform vec4 uDomain;
uniform vec4 uPlot;
uniform vec4 uCanvas;
uniform vec2 uFill;
uniform uvec4 uCounts;

out float vAcross;
out vec2 vLocal;
out vec2 vUv;
flat out float vWidth;
flat out float vKind;
flat out vec4 vColor;

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
  int yOffset = int(seriesIndex * uCounts.x);
  float x = loadValue(uXValues, uXTextureSize, int(pointIndex));
  float y = loadValue(uYValues, uYTextureSize, yOffset + int(pointIndex));
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

void gapOutput(vec4 color) {
  gl_Position = vec4(-2.0, -2.0, 0.0, 1.0);
  vAcross = 0.0;
  vLocal = vec2(0.0);
  vUv = vec2(0.0);
  vWidth = 0.0;
  vKind = 0.0;
  vColor = color;
}

void primitiveOutput() {
  vec2 quad = quadCoordinates(gl_VertexID);
  vec2 local = quad * 2.0 - 1.0;
  vec2 point = instanceKind.x < 0.5 || instanceKind.x > 1.5
    ? instanceGeometry.xy + quad * instanceGeometry.zw
    : instanceGeometry.xy + local * instanceGeometry.z;
  gl_Position = vec4(
    point.x / uCanvas.x * 2.0 - 1.0,
    1.0 - point.y / uCanvas.y * 2.0,
    0.0,
    1.0
  );
  vAcross = 0.0;
  vLocal = local;
  vUv = mix(instanceUv.xy, instanceUv.zw, quad);
  vWidth = 0.0;
  vKind = instanceKind.x;
  vColor = instanceColor;
}

void areaOutput() {
  uint pairsPerSeries = uCounts.x - 1u;
  uint reverseSeriesIndex = uint(gl_InstanceID) / pairsPerSeries;
  uint seriesIndex = uCounts.y - reverseSeriesIndex - 1u;
  uint pairIndex = uint(gl_InstanceID) % pairsPerSeries;
  int yOffset = int(seriesIndex * uCounts.x);

  float x0 = loadValue(uXValues, uXTextureSize, int(pairIndex));
  float x1 = loadValue(uXValues, uXTextureSize, int(pairIndex + 1u));
  float y0 = loadValue(uYValues, uYTextureSize, yOffset + int(pairIndex));
  float y1 = loadValue(uYValues, uYTextureSize, yOffset + int(pairIndex + 1u));
  vec4 color = loadColor(int(seriesIndex));
  if (isnan(y0) || isnan(y1) || color.a <= 0.0 || uFill.y <= 0.0) {
    gapOutput(color);
    return;
  }

  vec2 topA = toScreen(vec2(x0, y0));
  vec2 topB = toScreen(vec2(x1, y1));
  if (uint(uCanvas.w) == MODE_STEP) topB.y = topA.y;

  vec2 baselineA = toScreen(vec2(x0, uFill.x));
  vec2 baselineB = toScreen(vec2(x1, uFill.x));
  float plotBottom = uPlot.y + uPlot.w;
  baselineA.y = clamp(baselineA.y, uPlot.y, plotBottom);
  baselineB.y = clamp(baselineB.y, uPlot.y, plotBottom);

  vec2 quad = quadCoordinates(gl_VertexID);
  vec2 top = mix(topA, topB, quad.x);
  vec2 baseline = mix(baselineA, baselineB, quad.x);
  vec2 point = mix(top, baseline, quad.y);
  gl_Position = vec4(
    point.x / uCanvas.x * 2.0 - 1.0,
    1.0 - point.y / uCanvas.y * 2.0,
    0.0,
    1.0
  );
  vAcross = 0.0;
  vLocal = vec2(0.0);
  vUv = vec2(0.0);
  vWidth = 0.0;
  vKind = 0.0;
  vColor = vec4(color.rgb, color.a * uFill.y);
}

void main() {
  if (uPassType == 1) {
    primitiveOutput();
    return;
  }
  if (uPassType == 2) {
    areaOutput();
    return;
  }

  uint segmentsPerPair = uCounts.z;
  uint segmentsPerSeries = uCounts.w;
  uint instanceIndex = uint(gl_InstanceID);
  uint seriesIndex = instanceIndex / segmentsPerSeries;
  uint localSegment = instanceIndex % segmentsPerSeries;
  uint pairIndex = localSegment / segmentsPerPair;
  uint pairSegment = localSegment % segmentsPerPair;
  int yOffset = int(seriesIndex * uCounts.x);
  uint mode = uint(uCanvas.w);

  float x0 = loadValue(uXValues, uXTextureSize, int(pairIndex));
  float x1 = loadValue(uXValues, uXTextureSize, int(pairIndex + 1u));
  float y0 = loadValue(uYValues, uYTextureSize, yOffset + int(pairIndex));
  float y1 = loadValue(uYValues, uYTextureSize, yOffset + int(pairIndex + 1u));
  vec4 color = loadColor(int(seriesIndex));
  vec2 sourceA = toScreen(vec2(x0, y0));
  vec2 sourceB = toScreen(vec2(x1, y1));

  if (isnan(y0) || isnan(y1) || color.a <= 0.0) {
    gapOutput(color);
    return;
  }

  vec2 screenA = sourceA;
  vec2 screenB = sourceB;
  if (mode == MODE_STEP) {
    if (pairSegment == 0u) screenB = vec2(sourceB.x, sourceA.y);
    else screenA = vec2(sourceB.x, sourceA.y);
  } else if (mode == MODE_SMOOTH && segmentsPerPair > 1u) {
    SmoothControls controlsA = smoothControls(seriesIndex, pairIndex);
    SmoothControls controlsB = smoothControls(seriesIndex, pairIndex + 1u);
    float t0 = float(pairSegment) / float(segmentsPerPair);
    float t1 = float(pairSegment + 1u) / float(segmentsPerPair);
    screenA = cubicPoint(sourceA, controlsA.right, controlsB.left, sourceB, t0);
    screenB = cubicPoint(sourceA, controlsA.right, controlsB.left, sourceB, t1);
  }

  vec2 delta = screenB - screenA;
  float lengthPixels = length(delta);
  if (lengthPixels < 1e-6) {
    gapOutput(color);
    return;
  }

  vec2 quad = quadCoordinates(gl_VertexID);
  vec2 perpendicular = vec2(delta.y, -delta.x) / lengthPixels;
  float width = max(0.01, uCanvas.z);
  float halfExtent = width * 0.5 + AA_PADDING;
  float side = mix(1.0, -1.0, quad.y);
  vec2 screenPosition = mix(screenA, screenB, quad.x) + perpendicular * halfExtent * side;
  float clipX = screenPosition.x / uCanvas.x * 2.0 - 1.0;
  float clipY = 1.0 - screenPosition.y / uCanvas.y * 2.0;

  gl_Position = vec4(clipX, clipY, 0.0, 1.0);
  vAcross = halfExtent * (1.0 + side);
  vLocal = vec2(0.0);
  vUv = vec2(0.0);
  vWidth = width;
  vKind = 0.0;
  vColor = color;
}
`

export const fragmentShader = `#version 300 es
precision highp float;
precision highp int;

uniform int uPassType;
uniform sampler2D uAtlas;
in float vAcross;
in vec2 vLocal;
in vec2 vUv;
flat in float vWidth;
flat in float vKind;
flat in vec4 vColor;
out vec4 outputColor;

void main() {
  if (uPassType == 1) {
    float alpha = vColor.a;
    if (vKind > 0.5 && vKind < 1.5) {
      float distanceFromCenter = length(vLocal);
      float antialias = max(fwidth(distanceFromCenter), 1e-3);
      alpha *= 1.0 - smoothstep(1.0 - antialias, 1.0, distanceFromCenter);
    } else if (vKind > 1.5) {
      alpha *= texture(uAtlas, vUv).a;
    }
    outputColor = vec4(vColor.rgb, alpha);
    return;
  }
  if (uPassType == 2) {
    outputColor = vColor;
    return;
  }

  const float AA_PADDING = 1.0;
  float center = vWidth * 0.5 + AA_PADDING;
  float distanceFromCenter = abs(vAcross - center);
  float antialias = max(fwidth(vAcross), 1e-3) * 0.75;
  float inner = max(0.0, vWidth * 0.5 - antialias);
  float outer = vWidth * 0.5 + antialias;
  float coverage = 1.0 - smoothstep(inner, outer, distanceFromCenter);
  outputColor = vec4(vColor.rgb, vColor.a * coverage);
}
`
