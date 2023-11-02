const removeMiddleVowels = word => {
  if (/\d/.test(word) || word.length < 4) return word

  const middle = word.substring(1, word.length - 1)
  return [word.charAt(0), middle.replace(/([aeiou])/gi, ""), word.charAt(word.length - 1)].join("")
}

const removeDuplicateLetters = word => word.replace(/(\w)\1+/g, "$1")

const ellipsisInMiddle = (text, length) => {
  const partLength = Math.floor((text.length - length) / 2)
  const prefix = text.substring(0, partLength)
  const suffix = text.substring(text.length - partLength)

  return `${prefix}...${suffix}`
}

const replaceIfNeeded = (text, func, ...args) => {
  if (!text) return ""

  return text.replace(/([\w\d].+?)([\s-_@])([\w\d].+)+?/, (_, word, sep, word2) => {
    return `${func(word, ...args)}${sep}${replaceIfNeeded(word2, func, ...args)}`
  })
}

const shorten = (string, round = 0) => {
  if (!string || typeof string !== "string") return string

  switch (round) {
    case 0:
      return string.trim()
    case 1:
      return replaceIfNeeded(string, removeDuplicateLetters)
    case 2:
      return replaceIfNeeded(string, removeMiddleVowels)
    default:
      return ellipsisInMiddle(string, round)
  }
}

export const shortForLength = (string, maxLength = 30) => {
  if (!string || typeof string !== "string") return string

  let round = 0

  while (string.length > maxLength) {
    string = shorten(string, round)
    round = round + 1
  }

  return string
}

export default shorten
