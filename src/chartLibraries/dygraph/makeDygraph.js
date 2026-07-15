import Dygraph from "dygraphs"

const makeDygraphWithoutLegend = (...args) => {
  const plugins = Dygraph.PLUGINS
  const Legend = Dygraph.Plugins?.Legend

  if (!Array.isArray(plugins) || !Legend) return new Dygraph(...args)

  Dygraph.PLUGINS = plugins.filter(Plugin => Plugin !== Legend)

  try {
    return new Dygraph(...args)
  } finally {
    Dygraph.PLUGINS = plugins
  }
}

export default makeDygraphWithoutLegend
