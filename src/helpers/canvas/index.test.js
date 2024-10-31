import { createCanvas, copyCanvas } from "."

it("#createCanvas creates a canvas with the given width and height", () => {
  const canvas = createCanvas(100, 200)

  expect(canvas.width).toBe(100)
  expect(canvas.height).toBe(200)
})

it("#copyCanvas copies the source canvas to the target canvas", () => {
  const sourceCanvas = createCanvas(100, 200)
  const sourceCtx = sourceCanvas.getContext("2d")
  sourceCtx.fillStyle = "red"
  sourceCtx.fillRect(0, 0, 100, 200)

  const targetCanvas = createCanvas(100, 200)
  copyCanvas(sourceCanvas, targetCanvas)

  const targetCtx = targetCanvas.getContext("2d")
  const imageData = targetCtx.getImageData(0, 0, 100, 200).data

  expect(imageData).toEqual(new Uint8ClampedArray(100 * 200 * 4).fill(255))
})
