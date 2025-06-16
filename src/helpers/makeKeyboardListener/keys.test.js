import keyCodes, { aliasByCode, codesByAlias } from "./keys"

describe("keyboard keys utilities", () => {
  describe("keyCodes", () => {
    it("maps number keys correctly", () => {
      expect(keyCodes[48]).toBe("Digit0")
      expect(keyCodes[49]).toBe("Digit1")
      expect(keyCodes[57]).toBe("Digit9")
    })

    it("maps letter keys correctly", () => {
      expect(keyCodes[65]).toBe("KeyA")
      expect(keyCodes[90]).toBe("KeyZ")
    })

    it("maps arrow keys correctly", () => {
      expect(keyCodes[37]).toBe("ArrowLeft")
      expect(keyCodes[38]).toBe("ArrowUp")
      expect(keyCodes[39]).toBe("ArrowRight")
      expect(keyCodes[40]).toBe("ArrowDown")
    })

    it("maps function keys correctly", () => {
      expect(keyCodes[112]).toBe("F1")
      expect(keyCodes[123]).toBe("F12")
    })

    it("maps modifier keys correctly", () => {
      expect(keyCodes[16]).toBe("Shift")
      expect(keyCodes[17]).toBe("Control")
      expect(keyCodes[18]).toBe("Alt")
      expect(keyCodes[91]).toBe("Meta")
    })

    it("maps special keys correctly", () => {
      expect(keyCodes[27]).toBe("Escape")
      expect(keyCodes[13]).toBe("Enter")
      expect(keyCodes[32]).toBe("Space")
      expect(keyCodes[9]).toBe("Tab")
    })
  })

  describe("aliasByCode", () => {
    it("maps left and right shift to Shift", () => {
      expect(aliasByCode.ShiftLeft).toBe("Shift")
      expect(aliasByCode.ShiftRight).toBe("Shift")
    })

    it("maps left and right control to Control", () => {
      expect(aliasByCode.ControlLeft).toBe("Control")
      expect(aliasByCode.ControlRight).toBe("Control")
    })

    it("maps left and right alt to Alt", () => {
      expect(aliasByCode.AltLeft).toBe("Alt")
      expect(aliasByCode.AltRight).toBe("Alt")
    })

    it("maps left and right meta to Meta", () => {
      expect(aliasByCode.MetaLeft).toBe("Meta")
      expect(aliasByCode.MetaRight).toBe("Meta")
    })
  })

  describe("codesByAlias", () => {
    it("maps Shift to both shift keys", () => {
      expect(codesByAlias.Shift).toEqual(["ShiftLeft", "ShiftRight"])
    })

    it("maps Control to both control keys", () => {
      expect(codesByAlias.Control).toEqual(["ControlLeft", "ControlRight"])
    })

    it("maps Alt to both alt keys", () => {
      expect(codesByAlias.Alt).toEqual(["AltLeft", "AltRight"])
    })

    it("maps Meta to both meta keys", () => {
      expect(codesByAlias.Meta).toEqual(["MetaLeft", "MetaRight"])
    })
  })
})