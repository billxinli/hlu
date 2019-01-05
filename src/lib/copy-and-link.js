const fs = require('fs-extra')

const disk = require('diskusage')
const path = require('path')
const util = require('util')
const inquirer = require('inquirer')
const globCallback = require('glob')

const homeLabConfig = require('./get-config')
const searchMovie = require('./search-movies')

const asyncLstat = util.promisify(fs.lstat)
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

async function getFileStats (file) {
  const result = await asyncLstat(file)
  return {
    path: file,
    symlink: result.isSymbolicLink(),
    size: result.size
  }
}

function isNotSymlink (stats) {
  return !stats.symlink
}

function isNotSample (stats, sampleSize) {
  const sampleSizeBytes = sampleSize * 1024 * 1024 * 1024

  if (stats.path.match(/sample/gi)) {
    return stats.size > sampleSizeBytes
  }

  return true
}

async function resolveNames (movies) {

  let result = Promise.resolve()
  movies.forEach((movie) => {
    result = result.then(async () => {

      console.log('Processing: ', movie.path)
      const question = [
        {
          type: 'input',
          name: 'name',
          message: 'Movie name',
          default: async () => searchMovie(movie.path),
          validate: (value) => value.trim().length > 0
        }
      ]

      const answer = await inquirer.prompt(question)

      console.log(answer)
      return answer
    })
  })
  return result

}

async function copyAndLink (currentPath, offset, limit, sampleSize) {

  const mf = await glob('./**/*.+(' + ['mkv'].join('|') + ')', { cwd: currentPath })

  const absPathMf = mf.map(file => path.join(currentPath, file))

  const statMf = await Promise.all(absPathMf.map(getFileStats))

  const nonSymlinkMf = statMf.filter(isNotSymlink)

  const nonSamples = nonSymlinkMf.filter((stats) => isNotSample(stats, sampleSize))

  const limitMf = nonSamples.slice(offset, offset + limit)

  const nameMf = await resolveNames(limitMf)

  // var result = Promise.resolve()
  // tasks.forEach(task => {
  //   result = result.then(() => task())
  // })
  // return result

  console.log(limitMf)
//  const movieMountsInfo = await parseMovieMounts(movieMounts)

  return arguments

}

module.exports = copyAndLink
