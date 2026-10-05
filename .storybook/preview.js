import React from "react"
import { ThemeProvider, StyleSheetManager } from "styled-components"
import isPropValid from "@emotion/is-prop-valid"
import { Flex, DefaultTheme, DarkTheme, GlobalStyles } from "@netdata/netdata-ui"
import "uplot/dist/uPlot.min.css"

const shouldForwardProp = (propName, target) => {
  if (typeof target === "string") {
    // For HTML elements, forward the prop if it is a valid HTML attribute
    return isPropValid(propName)
  }
  // For other elements, forward all props
  return true
}

const isDarkStory = context =>
  context.parameters.netdataTheme === "dark" ||
  context.args?.theme === "dark" ||
  context.globals.theme === "dark"

const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: "fullscreen",
    backgrounds: { disabled: true },
  },

  decorators: [
    (Story, context) => {
      const theme = isDarkStory(context) ? DarkTheme : DefaultTheme

      return (
        <StyleSheetManager shouldForwardProp={shouldForwardProp}>
          <ThemeProvider theme={theme}>
            <GlobalStyles />
            <Flex
              width="100%"
              background="mainBackground"
              justifyContent="center"
              style={{ minHeight: "100vh" }}
            >
              <Story />
            </Flex>
          </ThemeProvider>
        </StyleSheetManager>
      )
    },
  ],
}

export const globalTypes = {
  theme: {
    description: "Global theme for components",
    defaultValue: "light",
    toolbar: {
      title: "Theme",
      icon: "circlehollow",
      items: ["light", "dark"],
      dynamicTitle: true,
    },
  },
}

export default preview
