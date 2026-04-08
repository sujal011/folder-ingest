export async function pickDirectoryAndWalk() {
  if (!window.showDirectoryPicker) {
    throw new Error('File System Access API is not supported in this browser.')
  }

  const dirHandle = await window.showDirectoryPicker()
  const results = []

  async function walkDirectory(handle, prefix = '') {
    // eslint-disable-next-line no-restricted-syntax
    for await (const [name, childHandle] of handle.entries()) {
      const relativePath = prefix ? `${prefix}/${name}` : name

      if (childHandle.kind === 'file') {
        const file = await childHandle.getFile()
        results.push({
          file,
          relativePath,
          size: file.size,
        })
      } else if (childHandle.kind === 'directory') {
        await walkDirectory(childHandle, relativePath)
      }
    }
  }

  await walkDirectory(dirHandle, '')
  return results
}

