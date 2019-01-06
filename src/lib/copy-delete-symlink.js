const fs = require('fs-extra')
const path = require('path')
const util = require('util')

const nameCleaner = require('./filename-cleaner')

const asyncStat = util.promisify(fs.stat)
const asyncMkdirs = util.promisify(fs.mkdirs)
const asyncCopy = util.promisify(fs.copy)
const asyncUnlink = util.promisify(fs.unlink)
const asyncSymlink = util.promisify(fs.symlink)

async function ensureDirectoryDoesNotExist (path) {
  try {
    await asyncStat(path)
    return false
  } catch (err) {
    return true
  }
}

async function makeNewAssetDirectory (path) {
  return await asyncMkdirs(path)
}

async function copyAsset (from, to) {
  return await asyncCopy(from, to)
}

async function deleteAsset (path) {
  return await asyncUnlink(path)
}

async function createSymlink (target, path) {
  return await asyncSymlink(target, path)
}

async function copyDeleteSymlink (source, target, folder, name) {
  const cleanName = nameCleaner(name)

  const newPath = [target, folder, cleanName].join('/')
  const newFile = [target, folder, cleanName, [cleanName, path.extname(source)].join('')].join('/')

  const doesNotExist = await ensureDirectoryDoesNotExist(newPath)

  if (!doesNotExist) {
    throw new Error(`${newPath} already exists.`)
  }

  await makeNewAssetDirectory(newPath)

  await copyAsset(source, newFile)

  await deleteAsset(source)

  await createSymlink(newFile, source)

}

module.exports = copyDeleteSymlink
