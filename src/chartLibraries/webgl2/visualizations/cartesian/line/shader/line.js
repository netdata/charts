export const vertexLine = `void main() {
  if (uPassType == 1) {
    primitiveOutput();
    return;
  }
  if (uPassType == 2) {
    areaOutput();
    return;
  }
  if (uPassType == 3) {
    stackedAreaOutput();
    return;
  }
  if (uPassType == 4) {
    stackedBarOutput();
    return;
  }

  uint segmentsPerPair = uCounts.z;
  uint segmentsPerSeries = uCounts.w;
  uint instanceIndex = uint(gl_InstanceID);
  uint seriesIndex = instanceIndex / segmentsPerSeries;
  uint localSegment = instanceIndex % segmentsPerSeries;
  uint pairIndex = localSegment / segmentsPerPair;
  uint pairSegment = localSegment % segmentsPerPair;
  uint mode = uint(uCanvas.w);

  float x0 = loadValue(uXValues, uXTextureSize, int(pairIndex));
  float x1 = loadValue(uXValues, uXTextureSize, int(pairIndex + 1u));
  float y0 = loadValue(uYValues, uYTextureSize, valueIndex(seriesIndex, pairIndex));
  float y1 = loadValue(uYValues, uYTextureSize, valueIndex(seriesIndex, pairIndex + 1u));
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
  vStrokeColor = color;
}
`
