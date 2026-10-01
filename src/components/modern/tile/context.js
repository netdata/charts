import { createContext, useContext } from "react"

export const TileContext = createContext(false)

export const useInModernTile = () => useContext(TileContext)

export const TileMenuContext = createContext(false)

export const useInModernTileMenu = () => useContext(TileMenuContext)
