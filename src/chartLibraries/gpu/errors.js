export class UnsupportedVisualizationConfigurationError extends Error {
  constructor(message) {
    super(message)
    this.name = "UnsupportedVisualizationConfigurationError"
  }
}

export const isUnsupportedVisualizationConfiguration = error =>
  error instanceof UnsupportedVisualizationConfigurationError
