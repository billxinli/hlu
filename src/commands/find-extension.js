const _ = require('lodash')
const path = require('path')

const findExtensions = require('../lib/find-extensions')

module.exports = {
  command: 'find-ext',
  describe: 'Find extensions under',
  builder: {
    path: {
      alias: 'p',
      describe: 'Path to search, defaults to cwd'
    }
  },
  handler: async (argv) => {
    const cwd = (argv.path) ? path.resolve(argv.path) : process.cwd()

    const files = await findExtensions(cwd)

    files.map((file) => {
      console.log(path.join(cwd, file))
    })

    console.log(`${files.length} files found.`)
  }
}
