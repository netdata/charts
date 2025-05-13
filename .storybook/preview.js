import React from "react"
import { ThemeProvider, StyleSheetManager } from "styled-components"
import isPropValid from "@emotion/is-prop-valid"
import { Flex, DefaultTheme, DarkTheme, GlobalStyles } from "@netdata/netdata-ui"

const shouldForwardProp = (propName, target) => {
  if (typeof target === "string") {
    // For HTML elements, forward the prop if it is a valid HTML attribute
    return isPropValid(propName)
  }
  // For other elements, forward all props
  return true
}

const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: "centered",
    backgrounds: { disable: true },
  },

  decorators: [
    (Story, context) => {
      const theme = context.globals.theme === "dark" ? DarkTheme : DefaultTheme

      return (
        <StyleSheetManager shouldForwardProp={shouldForwardProp}>
          <ThemeProvider theme={theme}>
            <GlobalStyles />
            <Flex width="100vw" height="100vh" background="mainBackground" justifyContent="center">
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
