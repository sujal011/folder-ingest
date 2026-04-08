export function estimateTokens(totalChars) {
  return Math.round(totalChars / 4)
}

export function formatDigest(files) {
  const lines = []

  files.forEach((file) => {
    lines.push('==============================================')
    lines.push(`FILE: ${file.relativePath}`)
    lines.push('==============================================')

    if (file.included && file.content != null) {
      lines.push(file.content)
    } else {
      lines.push('[Content skipped due to size or limits]')
    }

    lines.push('')
  })

  return lines.join('\n')
}

