import { createContext, useContext } from "react"

// lets overlays rendered inside a modern tile hand their readout to the tile layout
export const TileContext = createContext(false)

export const useInModernTile = () => useContext(TileContext)
