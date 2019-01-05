const path = require('path')
const util = require('util')
const inquirer = require('inquirer')
const globCallback = require('glob')

const glob = util.promisify(globCallback)

async function findExtensions (currentPath) {

  const allFiles = await glob('**/*', { cwd: currentPath })

  const exts = allFiles.reduce((extensions, file) => {
    const ext = path.extname(file)
    if (!extensions.includes(ext) && ext.trim().length > 0) {
      extensions.push(ext)
    }
    return extensions
  }, [])

  const answers = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'ext',
      message: 'What extensions?',
      choices: exts,
      default: ['.mkv']
    }
  ])

  const files = await glob('**/*.+(' + answers.ext.join('|').replace(/\./g, '') + ')', { cwd: currentPath })

  return files
}

module.exports = findExtensions
