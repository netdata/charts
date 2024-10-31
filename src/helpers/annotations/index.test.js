import { enums, check } from "."

it("#check", () => {
  expect(check(enums.E, enums.E)).toBe(1)
  expect(check(enums.E, enums.O)).toBe(0)
  expect(check(enums.E, enums.P)).toBe(0)
  expect(check(enums.O, enums.E)).toBe(0)
  expect(check(enums.O, enums.O)).toBe(2)
  expect(check(enums.O, enums.P)).toBe(0)
  expect(check(enums.P, enums.E)).toBe(0)
  expect(check(enums.P, enums.O)).toBe(0)
  expect(check(enums.P, enums.P)).toBe(4)
})
