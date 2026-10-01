import { createContext, useContext } from "react"

// lets overlays rendered inside a modern tile hand their readout to the tile layout
export const TileContext = createContext(false)

export const useInModernTile = () => useContext(TileContext)

// consumer toolbox elements rendered in the tile's More menu; a consumer button the tile already
// provides (such as a drag handle) can read this and render nothing there
export const TileMenuContext = createContext(false)

export const useInModernTileMenu = () => useContext(TileMenuContext)
