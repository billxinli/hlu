const disk = require('diskusage')

const homeLabConfig = require('./get-config')

console.log(homeLabConfig)

const { movieMounts } = homeLabConfig

async function parseMovieMounts (mounts) {
  const results = await Promise.all(mounts.map(async (mount) => {
    const result = {
      mount,
      ...await disk.check(mount)
    }
    return result
  }))
  return results
}

async function copyAndLink (currentPath, offset, limit, sampleSize) {

  const movieMounts = await parseMovieMounts(movieMounts)

  console.log(movieMounts)

  return arguments

}

module.exports = copyAndLink
