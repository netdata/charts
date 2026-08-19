module.exports = ({ context, page }) => ({
  openScope: async ({ viewport } = {}) => {
    if (viewport) await page.setViewportSize(viewport)
    const sessions = []

    return {
      page,
      newCDPSession: async () => {
        const session = await context.newCDPSession(page)
        sessions.push(session)
        return session
      },
      close: async () =>
        Promise.all(sessions.map(session => session.detach())),
    }
  },
  resetPage: () => page.goto("about:blank"),
})
