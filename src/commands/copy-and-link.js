const _ = require('lodash')
const path = require('path')

const copyAndLink = require('./../lib/copy-and-link')

module.exports = {
  command: 'copy-and-link',
  aliases: ['cal'],
  describe: 'Copy and link movies',
  builder: {
    path: {
      alias: 'p',
      describe: 'Path to search, defaults to cwd'
    },
    offset: {
      alias: 'o',
      describe: 'Offset the beginning',
      type: 'number',
      default: 0
    },
    limit: {
      alias: 'l',
      describe: 'Limit the number of results',
      type: 'number',
      default: 100
    },
    sample: {
      alias: 's',
      describe: 'Sample size, in GB, defaults to 1GB',
      type: 'number',
      default: 1
    }
  },
  handler: async (argv) => {
    const cwd = (argv.path) ? path.resolve(argv.path) : process.cwd()
    const { offset, limit, sample } = argv

    const results = await copyAndLink(cwd, offset, limit, sample)

    console.log(results)
  }
}
