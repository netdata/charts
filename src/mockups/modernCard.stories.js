import React from "react"
import { FontLink } from "./primitives"
import { themes } from "./chartCard"
import { ModernCard } from "./modernCard"

const themeArg = {
  args: { theme: "light" },
  argTypes: { theme: { control: "radio", options: ["light", "dark"] } },
}

const Page = ({ theme, children }) => (
  <div
    style={{
      background: themes[theme].ground,
      minHeight: "100vh",
      padding: 28,
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      gap: 20,
    }}
  >
    <FontLink />
    {children}
  </div>
)

const Row = ({ children }) => (
  <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>{children}</div>
)

export const Adaptive = ({ theme }) => (
  <Page theme={theme}>
    <ModernCard theme={theme} dataset="disks" width={1300} height={220} />
    <Row>
      <ModernCard theme={theme} dataset="load" width={640} />
      <ModernCard theme={theme} dataset="disks" width={640} />
    </Row>
    <Row>
      <ModernCard theme={theme} dataset="load" width={420} height={130} legend="below" />
      <ModernCard theme={theme} dataset="load" width={410} height={130} />
      <ModernCard theme={theme} dataset="disks" width={410} height={130} />
    </Row>
  </Page>
)
Object.assign(Adaptive, themeArg)

export const EverythingOpen = ({ theme }) => (
  <Page theme={theme}>
    <ModernCard
      theme={theme}
      dataset="load"
      width={900}
      height={220}
      filtersOpen
      menuOpen
      zoomed
      actionsVisible
    />
  </Page>
)
Object.assign(EverythingOpen, themeArg)

export const HeadlineOptions = ({ theme }) => (
  <Page theme={theme}>
    <Row>
      <ModernCard theme={theme} dataset="load" width={640} headline="value" />
      <ModernCard theme={theme} dataset="load" width={640} headline="attention" />
    </Row>
    <Row>
      <ModernCard theme={theme} dataset="disks" width={640} headline="value" />
      <ModernCard theme={theme} dataset="disks" width={640} headline="attention" />
    </Row>
  </Page>
)
Object.assign(HeadlineOptions, themeArg)

export default {
  title: "Mockups/Modern card",
  parameters: { layout: "fullscreen" },
}
