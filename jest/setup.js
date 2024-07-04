import "jest-canvas-mock"

Element.prototype.getBoundingClientRect = jest.fn(() => {
  return {
    width: 120,
    height: 120,
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  }
})
