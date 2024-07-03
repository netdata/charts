import limitRange from "."

const date = 1657640000

describe("limitRange", () => {
  it("should return the same range when duration is 60 seconds or more", () => {
    expect(limitRange({ after: date - 60, before: date })).toEqual({
      fixedAfter: date - 60,
      fixedBefore: date,
    })
    expect(limitRange({ after: date - 120, before: date })).toEqual({
      fixedAfter: date - 120,
      fixedBefore: date,
    })
  })
  it("should now allow duration less than 60 sec", () => {
    expect(limitRange({ after: date - 59, before: date })).toEqual({
      fixedAfter: date - 60.5,
      fixedBefore: date + 0.5,
    })
    expect(limitRange({ after: date - 58, before: date })).toEqual({
      fixedAfter: date - 59,
      fixedBefore: date + 1,
    })
  })
})
