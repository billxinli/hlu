const fs = require('fs-extra')
const colors = require('colors')

const disk = require('diskusage')
const path = require('path')
const util = require('util')
const inquirer = require('inquirer')
const globCallback = require('glob')
const Promise = require('bluebird')

const homeLabConfig = require('./get-config')
const searchMovie = require('./search-movies')
const nameCleaner = require('./filename-cleaner')
const copyDeleteSymlink = require('./copy-delete-symlink')

const asyncLstat = util.promisify(fs.lstat)
const glob = util.promisify(globCallback)
const { movieMounts } = homeLabConfig

async function parseMovieMounts (mounts) {
  return await Promise.all(mounts.map(async (mount) => {
    return {
      mount,
      ...await disk.check(mount)
    }
  }))
}

async function getFileStats (file) {
  const result = await asyncLstat(file)
  return {
    sourcePath: file,
    targetFolder: 'movies',
    symlink: result.isSymbolicLink(),
    size: result.size
  }
}

function isNotSymlink (stats) {
  return !stats.symlink
}

function isNotSkipped (stats) {
  return stats.movieName !== 'skip'
}

function isNotSample (stats, sampleSize) {
  const sampleSizeBytes = sampleSize * 1024 * 1024 * 1024

  if (stats.sourcePath.match(/sample/gi)) {
    return stats.size > sampleSizeBytes
  }

  return true
}

async function resolveNames (movies) {
  const results = Promise.map(movies, async (movie) => {
    console.log('Processing: ', movie.sourcePath)
    const question = [
      {
        type: 'input',
        name: 'movieName',
        message: 'Movie name',
        default: async () => searchMovie(movie.sourcePath),
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
        result.targetMount = mount.mount
        mount.available -= result.size
        return true
      }
    })
    return result
  })
}

async function getTargetStatus (stats) {
  const result = {
    ...stats
  }
  const fullPath = path.join(result.targetMount, result.targetFolder, nameCleaner(result.movieName))
  try {
    await asyncLstat(fullPath)
    result.targetMissing = false
    console.error(`${result.movieName} already exist on ${fullPath}`)
  } catch (err) {
    result.targetMissing = true
  }
  return result
}

function isNotAlreadyExist (stats) {
  return stats.targetMissing
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

  const checkDestinationMf = await Promise.all(mappedTargetMf.map(getTargetStatus))

  const targetMissingMf = checkDestinationMf.filter(isNotAlreadyExist)

  return Promise.map(targetMissingMf, async (mf) => {
    console.log(colors.green(`Processing ${mf.movieName}`))
    await copyDeleteSymlink(mf.sourcePath, mf.targetMount, mf.targetFolder, mf.movieName)
  }, { concurrency: 1 })

}

module.exports = copyAndLink
