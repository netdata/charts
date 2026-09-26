export default async (surface, factories) => {
  const entries = Object.entries(factories)
  const settled = await Promise.allSettled(
    entries.map(([, create]) => Promise.resolve().then(create))
  )
  const failed = settled.find(result => result.status === "rejected")

  if (failed) {
    settled.forEach(
      result => result.status === "fulfilled" && result.value.destroy?.()
    )
    surface.destroy()
    throw failed.reason
  }

  const resources = Object.fromEntries(
    entries.map(([name], index) => [name, settled[index].value])
  )
  return {
    surface,
    ...resources,
    destroy: () => {
      Object.values(resources).forEach(resource => resource.destroy())
      surface.destroy()
    },
  }
}
