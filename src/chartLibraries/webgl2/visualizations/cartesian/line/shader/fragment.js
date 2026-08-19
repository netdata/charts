export const fragmentSource = `#version 300 es
precision highp float;
precision highp int;

// Matches Canvas2D fillRect/strokeRect subpixel edge composition.
const float CANVAS_STROKE_COVERAGE = 1.17;

uniform int uPassType;
uniform sampler2D uAtlas;
in float vAcross;
in vec2 vLocal;
in vec2 vUv;
flat in float vWidth;
flat in float vKind;
flat in vec4 vColor;
flat in vec4 vStrokeColor;
out vec4 outputColor;

float axisCoverage(float center, float minimum, float maximum) {
  return clamp(min(center + 0.5, maximum) - max(center - 0.5, minimum), 0.0, 1.0);
}

float rectCoverage(vec2 point, vec2 minimum, vec2 maximum) {
  if (maximum.x <= minimum.x || maximum.y <= minimum.y) return 0.0;
  return axisCoverage(point.x, minimum.x, maximum.x) *
    axisCoverage(point.y, minimum.y, maximum.y);
}

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
  if (uPassType == 2 || uPassType == 3) {
    outputColor = vColor;
    return;
  }
  if (uPassType == 4) {
    float fillCoverage = rectCoverage(vLocal, vec2(0.0), vUv);
    float halfStroke = vWidth * 0.5;
    float outerCoverage = rectCoverage(
      vLocal,
      vec2(-halfStroke),
      vUv + vec2(halfStroke)
    );
    float innerCoverage = rectCoverage(
      vLocal,
      vec2(halfStroke),
      vUv - vec2(halfStroke)
    );
    float strokeCoverage = clamp(
      (outerCoverage - innerCoverage) * CANVAS_STROKE_COVERAGE,
      0.0,
      1.0
    );
    float fillAlpha = vColor.a * fillCoverage * (1.0 - strokeCoverage);
    float alpha = strokeCoverage + fillAlpha;
    if (alpha <= 0.0) discard;
    vec3 premultiplied =
      vStrokeColor.rgb * strokeCoverage + vColor.rgb * fillAlpha;
    outputColor = vec4(premultiplied / alpha, alpha);
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
