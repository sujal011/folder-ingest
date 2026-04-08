function patternToRegex(pattern) {
  const trimmed = pattern.trim()
  if (!trimmed) return null

  let escaped = trimmed.replace(/[.+?^${}()|[\]\\]/g, '\\$&')

  escaped = escaped.replace(/\*\*/g, '.*')
  escaped = escaped.replace(/\*/g, '[^/]*')

  return new RegExp(`^${escaped}$`, 'i')
}

export function filterFilesByGlob(files, patterns) {
  const regexes = patterns
    .map((p) => patternToRegex(p))
    .filter((re) => re !== null)

  return files.filter((entry) => {
    const rel = entry.relativePath.replace(/\\/g, '/')

    if (
      rel === '.git' ||
      rel.endsWith('/.git') ||
      rel.startsWith('.git/') ||
      rel.includes('/.git/')
    ) {
      return false
    }

    if (!regexes.length) return true

    return !regexes.some((re) => re.test(rel))
  })
}


