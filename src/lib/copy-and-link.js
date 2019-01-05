const fs = require('fs-extra')

const disk = require('diskusage')
const path = require('path')
const util = require('util')
const inquirer = require('inquirer')
const globCallback = require('glob')

const homeLabConfig = require('./get-config')

const glob = util.promisify(globCallback)
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

const asyncLstat = util.promisify(fs.lstat)

async function copyAndLink (currentPath, offset, limit, sampleSize) {

  const mf = await glob('./**/*.+(' + ['mkv'].join('|') + ')', { cwd: currentPath })

  const filteredMf = mf.slice(offset, offset + limit)

  const absPathMf = filteredMf.map(file => path.join(currentPath, file))

  const statMf = await Promise.all(absPathMf.map(async (mfPath) => {
    const result = await asyncLstat(mfPath)
    return {
      path: mfPath,
      symlink: result.isSymbolicLink(),
      size: result.size,
      result
    }
  }))

  const nonSymlinkMf = statMf.filter((mfPath) => !mfPath.symlink)

  console.log(nonSymlinkMf)

  const movieMountsInfo = await parseMovieMounts(movieMounts)

  console.log(movieMountsInfo)

  return arguments

}

module.exports = copyAndLink
