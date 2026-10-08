import retireAfterSubmission from "./retirement"

describe("WebGPU resource retirement", () => {
  it("keeps a replaced resource alive until submitted work completes", async () => {
    let complete
    const submission = new Promise(resolve => {
      complete = resolve
    })
    let destroyed = false
    const retired = retireAfterSubmission(submission, {
      destroy: () => {
        destroyed = true
      },
    })

    await Promise.resolve()
    expect(destroyed).toBe(false)
    complete()
    await retired
    expect(destroyed).toBe(true)
  })
})
