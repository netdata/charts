import "jest-canvas-mock"
import React from "react"
import { TextEncoder, TextDecoder } from "util"

globalThis.React = React
globalThis.TextEncoder = TextEncoder
globalThis.TextDecoder = TextDecoder

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
    bottom: 120,
    right: 120,
    x: 0,
    y: 0,
  }
})

Object.defineProperties(HTMLElement.prototype, {
  offsetHeight: {
    get() {
      return parseFloat(this.style.height) || 500
    },
    configurable: true,
  },
  offsetWidth: {
    get() {
      return parseFloat(this.style.width) || 500
    },
    configurable: true,
  },
  scrollHeight: {
    get() {
      return parseFloat(this.style.minHeight) || parseFloat(this.style.height) || 500
    },
    configurable: true,
  },
  scrollWidth: {
    get() {
      return parseFloat(this.style.width) || 500
    },
    configurable: true,
  },
  clientHeight: {
    get() {
      return parseFloat(this.style.height) || 500
    },
    configurable: true,
  },
  clientWidth: {
    get() {
      return parseFloat(this.style.width) || 500
    },
    configurable: true,
  },
})
