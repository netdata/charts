const E = 1 // the database value is empty
const O = 2 // the database value is marked as reset (overflown/reset)
const P = 4 // the database provides partial data about this point (used in group-by)

export const enums = {
  E,
  O,
  P,
}

export const parts = Object.keys(enums)

export const check = (bit, annotation) => bit & annotation

export const colors = {
  P: "RGB(126, 189, 194)",
  O: "RGB(243, 223, 162)",
  E: "RGB(232, 185, 219)",
}

export const priorities = {
  E: 0,
  P: 1,
  O: 2,
}

export const labels = {
  E: "Empty data",
  P: "Partial data",
  O: "Overflow",
}
