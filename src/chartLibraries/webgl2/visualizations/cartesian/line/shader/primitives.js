export const vertexPrimitives = `void gapOutput(vec4 color) {
  gl_Position = vec4(-2.0, -2.0, 0.0, 1.0);
  vAcross = 0.0;
  vLocal = vec2(0.0);
  vUv = vec2(0.0);
  vWidth = 0.0;
  vKind = 0.0;
  vColor = color;
  vStrokeColor = color;
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
  vStrokeColor = instanceColor;
}
`
