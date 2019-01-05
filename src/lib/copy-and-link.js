const fs = require('fs-extra')

const disk = require('diskusage')
const path = require('path')
const util = require('util')
const inquirer = require('inquirer')
const globCallback = require('glob')
const Promise = require('bluebird')

const homeLabConfig = require('./get-config')
const searchMovie = require('./search-movies')
const nameCleaner = require('./filename-cleaner')

const asyncLstat = util.promisify(fs.lstat)
const glob = util.promisify(globCallback)
const { movieMounts } = homeLabConfig

async function parseMovieMounts (mounts) {
  return await Promise.all(mounts.map(async (mount) => {
    return {
      mount,
      folder: 'movies',
      ...await disk.check(mount)
    }
  }))
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

function isNotSkipped (stats) {
  return stats.name !== 'skip'
}

function isNotSample (stats, sampleSize) {
  const sampleSizeBytes = sampleSize * 1024 * 1024 * 1024

  if (stats.path.match(/sample/gi)) {
    return stats.size > sampleSizeBytes
  }

  return true
}

async function resolveNames (movies) {
  const results = Promise.map(movies, async (movie) => {
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
    return {
      ...answer,
      ...movie
    }
  }, { concurrency: 1 })
  return results
}

async function mapFileToMount (movies) {
  const movieMountsInfo = await parseMovieMounts(movieMounts)

  return movies.map((mf) => {
    const result = {
      ...mf
    }
    movieMountsInfo.some((mount) => {
      if (mount.available > result.size) {
        result.target = mount.mount
        mount.available -= result.size
        return true
      }
    })
    return result
  })
}

async function isNotExistingTarget (movie) {
  const result = {
    ...movie
  }
  const fullPath = path.join(movie.target, movie.folder, nameCleaner(movie.name))
  try {
    const result = await asyncLstat(fullPath)
    result.targetMissing = false
  } catch (err) {
    result.targetMissing = true
  }
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

  const notSkippedMf = nameMf.filter(isNotSkipped)

  const mappedTargetMf = await mapFileToMount(notSkippedMf)

  const checkDestinationMf = await Promise.all(mappedTargetMf.map(isNotExistingTarget))

  console.log(checkDestinationMf)

  return arguments

}

module.exports = copyAndLink
