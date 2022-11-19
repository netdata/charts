const removeMiddleVowels = word => {
  if (/\d/.test(word)) return word
  const middle = word.substring(1, word.length - 1)
  return [word.charAt(0), middle.replace(/([aeiou])/gi, ""), word.charAt(word.length - 1)].join("")
}

const removeDuplicateLetters = word => word.replace(/(\w)\1+/g, "$1")

const replaceIfNeeded = (text, func, maxLength) => {
  if (text.length <= maxLength) return text
  return text.replace(/(\w.+?|\d.+)([\s-_.@]+?)/g, (_, word, sep) => {
    word = func(word)

    return `${word}${sep}`
  })
}

export default (string, maxLength = 60) => {
  if (string.length <= maxLength) return string

  let [, text, lastText] = string.trim().match(/(.+[\s-_.@])(.+)$/)

  text = replaceIfNeeded(text, removeMiddleVowels, maxLength - lastText.length)
  text = replaceIfNeeded(text, removeDuplicateLetters, maxLength - lastText.length)

  if ((text + lastText).length <= maxLength) return text + lastText

  lastText = removeMiddleVowels(removeDuplicateLetters(lastText))

  if ((text + lastText).length <= maxLength) return text + lastText

  text = text + lastText
  const partLength = Math.floor((maxLength - 3) / 2)
  const prefix = text.substring(0, partLength)
  const suffix = text.substring(text.length - partLength)

  return `${prefix}...${suffix}`
}
