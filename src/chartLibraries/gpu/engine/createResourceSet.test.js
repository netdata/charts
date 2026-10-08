import createResourceSet from "./createResourceSet"

describe("GPU resource-set ownership", () => {
  it("destroys every owned layer before its surface", async () => {
    const order = []
    const resources = await createResourceSet(
      { destroy: () => order.push("surface") },
      {
        first: () => ({ destroy: () => order.push("first") }),
        second: () => ({ destroy: () => order.push("second") }),
      }
    )

    resources.destroy()

    expect(order).toEqual(["first", "second", "surface"])
  })

  it("cleans fulfilled layers when another factory fails", async () => {
    const order = []
    await expect(
      createResourceSet(
        { destroy: () => order.push("surface") },
        {
          first: () => ({ destroy: () => order.push("first") }),
          failed: () => Promise.reject(new Error("failed")),
        }
      )
    ).rejects.toThrow("failed")

    expect(order).toEqual(["first", "surface"])
  })
})
