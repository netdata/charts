import Dygraph from "dygraphs"
import makeDygraphWithoutLegend from "./makeDygraph"

const originalPlugins = Dygraph.PLUGINS
const instances = []

const createElement = () => {
  const element = document.createElement("div")
  Object.defineProperties(element, {
    clientWidth: { value: 800 },
    clientHeight: { value: 400 },
  })
  element.style.padding = "0px"
  document.body.appendChild(element)
  return element
}

const createDygraph = (options = {}) => {
  const element = createElement()

  const instance = makeDygraphWithoutLegend(element, [[0, 1]], {
    labels: ["time", "value"],
    legend: "never",
    ...options,
  })

  instances.push(instance)
  return instance
}

describe("makeDygraph without the built-in legend", () => {
  afterEach(() => {
    instances.splice(0).forEach(instance => instance.destroy())
    document.body.replaceChildren()
    Dygraph.PLUGINS = originalPlugins
  })

  it("omits only the unused built-in legend plugin", () => {
    const instance = createDygraph()
    const activePluginTypes = instance.plugins_.map(({ plugin }) => plugin.constructor)

    expect(activePluginTypes).toEqual(
      originalPlugins.filter(Plugin => Plugin !== Dygraph.Plugins.Legend)
    )
    expect(Dygraph.PLUGINS).toBe(originalPlugins)
  })

  it("preserves plugins supplied for the chart instance", () => {
    const customPlugin = {
      activate: () => ({}),
    }
    const instance = createDygraph({ plugins: [customPlugin] })

    expect(instance.plugins_.some(({ plugin }) => plugin === customPlugin)).toBe(true)
    expect(Dygraph.PLUGINS).toBe(originalPlugins)
  })

  it("restores the global plugin registry when construction fails", () => {
    class FailingPlugin {
      activate() {
        throw new Error("plugin failed")
      }
    }

    const configuredPlugins = [...originalPlugins, FailingPlugin]
    Dygraph.PLUGINS = configuredPlugins

    const element = createElement()

    expect(() =>
      makeDygraphWithoutLegend(element, [[0, 1]], {
        labels: ["time", "value"],
        legend: "never",
      })
    ).toThrow("plugin failed")
    expect(Dygraph.PLUGINS).toBe(configuredPlugins)
  })
})
