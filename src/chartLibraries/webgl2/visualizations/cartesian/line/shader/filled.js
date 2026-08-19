export const vertexFilled = `void areaOutput() {
  uint pairsPerSeries = uCounts.x - 1u;
  uint reverseSeriesIndex = uint(gl_InstanceID) / pairsPerSeries;
  uint seriesIndex = uCounts.y - reverseSeriesIndex - 1u;
  uint pairIndex = uint(gl_InstanceID) % pairsPerSeries;

  float x0 = loadValue(uXValues, uXTextureSize, int(pairIndex));
  float x1 = loadValue(uXValues, uXTextureSize, int(pairIndex + 1u));
  float y0 = loadValue(uYValues, uYTextureSize, valueIndex(seriesIndex, pairIndex));
  float y1 = loadValue(uYValues, uYTextureSize, valueIndex(seriesIndex, pairIndex + 1u));
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
  vStrokeColor = color;
}

void stackedAreaOutput() {
  uint pairsPerSeries = uCounts.x - 1u;
  uint seriesIndex = uint(gl_InstanceID) / pairsPerSeries;
  uint pairIndex = uint(gl_InstanceID) % pairsPerSeries;
  int offset = valueIndex(seriesIndex, pairIndex);
  int nextOffset = valueIndex(seriesIndex, pairIndex + 1u);

  float x0 = loadValue(uXValues, uXTextureSize, int(pairIndex));
  float x1 = loadValue(uXValues, uXTextureSize, int(pairIndex + 1u));
  float end0 = loadValue(uYValues, uYTextureSize, offset);
  float end1 = loadValue(uYValues, uYTextureSize, nextOffset);
  float base0 = loadValue(uBaseValues, uBaseTextureSize, offset);
  float base1 = loadValue(uBaseValues, uBaseTextureSize, nextOffset);
  vec4 color = loadColor(int(seriesIndex));
  if (
    isnan(end0) || isnan(end1) || isnan(base0) || isnan(base1) ||
    color.a <= 0.0 || uFill.y <= 0.0
  ) {
    gapOutput(color);
    return;
  }

  vec2 topA = toScreen(vec2(x0, end0));
  vec2 topB = toScreen(vec2(x1, end1));
  if (uint(uCanvas.w) == MODE_STEP) topB.y = topA.y;
  vec2 baselineA = toScreen(vec2(x0, base0));
  vec2 baselineB = toScreen(vec2(x1, base1));
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
  vStrokeColor = color;
}

void stackedBarOutput() {
  uint pointCount = uCounts.x;
  uint seriesIndex = uint(gl_InstanceID) / pointCount;
  uint pointIndex = uint(gl_InstanceID) % pointCount;
  bool isMultiBar = uFill.z > 1.5;
  int offset = valueIndex(seriesIndex, pointIndex);
  int colorOffset = int(seriesIndex) * (isMultiBar ? 3 : 2);
  float x = loadValue(uXValues, uXTextureSize, int(pointIndex));
  float end = loadValue(uYValues, uYTextureSize, offset);
  float base = isMultiBar
    ? uFill.y
    : loadValue(uBaseValues, uBaseTextureSize, offset);
  vec4 color = loadColor(colorOffset);
  vec4 strokeColor = loadColor(colorOffset + 1);
  vec2 visibility = isMultiBar ? loadColor(colorOffset + 2).xy : vec2(0.0, 1.0);
  if (
    isnan(end) || isnan(base) || color.a <= 0.0 ||
    visibility.x < 0.0 || visibility.y <= 0.0
  ) {
    gapOutput(color);
    return;
  }

  vec2 center = toScreen(vec2(x, end));
  float baseY = toScreen(vec2(x, base)).y;
  float barWidth = uFill.x;
  float xLeft = center.x - barWidth * 0.5;
  if (isMultiBar) {
    float rankDenominator = visibility.y > 1.0 ? visibility.y - 1.0 : 1.0;
    xLeft = center.x - uFill.x * 0.5 *
      (1.0 - visibility.x / rankDenominator);
    barWidth = uFill.x / visibility.y;
  }
  float strokeWidth = max(0.0, uCanvas.z);
  vec2 fillOrigin = vec2(xLeft, min(center.y, baseY));
  vec2 fillSize = vec2(barWidth, abs(center.y - baseY));
  vec2 antialiasPadding = vec2(isMultiBar ? 0.5 : 0.0, 0.5);
  vec2 outerOrigin = fillOrigin - vec2(strokeWidth * 0.5) - antialiasPadding;
  vec2 outerSize = fillSize + vec2(strokeWidth) + antialiasPadding * 2.0;
  vec2 quad = quadCoordinates(gl_VertexID);
  vec2 point = outerOrigin + quad * outerSize;
  gl_Position = vec4(
    point.x / uCanvas.x * 2.0 - 1.0,
    1.0 - point.y / uCanvas.y * 2.0,
    0.0,
    1.0
  );
  vAcross = 0.0;
  vLocal = quad * outerSize - vec2(strokeWidth * 0.5) - antialiasPadding;
  vUv = fillSize;
  vWidth = strokeWidth;
  vKind = 4.0;
  vColor = color;
  vStrokeColor = strokeColor;
}
`
