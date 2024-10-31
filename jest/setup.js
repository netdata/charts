import "jest-canvas-mock"

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserver

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
