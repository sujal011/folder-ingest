export function buildTree(paths) {
  const root = {}

  paths.forEach((rawPath) => {
    const path = rawPath.replace(/\\/g, '/')
    const parts = path.split('/').filter(Boolean)
    let node = root

    parts.forEach((part, index) => {
      if (!node[part]) {
        node[part] = {
          name: part,
          isFile: index === parts.length - 1,
          children: {},
        }
      }
      node = node[part].children
    })
  })

  return root
}

export function renderTreeLines(tree, prefix = '') {
  const entries = Object.values(tree).sort((a, b) =>
    a.name.localeCompare(b.name),
  )

  const lines = []

  entries.forEach((entry, index) => {
    const isLast = index === entries.length - 1
    const connector = isLast ? '└── ' : '├── '
    lines.push(`${prefix}${connector}${entry.name}`)

    const childPrefix = `${prefix}${isLast ? '    ' : '│   '}`
    const childLines = renderTreeLines(entry.children, childPrefix)
    lines.push(...childLines)
  })

  return lines
}

