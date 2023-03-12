export function createCanvas(width, height) {
  const backgroundCanvas = document.createElement("canvas")
  backgroundCanvas.width = width
  backgroundCanvas.height = height

  return backgroundCanvas
}

export function copyCanvas(sourceCanvas, targetCanvas) {
  targetCanvas.width = sourceCanvas.width
  targetCanvas.height = sourceCanvas.height

  const ctx = targetCanvas.getContext("2d")
  ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height)
  ctx.drawImage(sourceCanvas, 0, 0)
}
