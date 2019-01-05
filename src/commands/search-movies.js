const searchMovies = require('../lib/search-movies')

module.exports = {
  command: 'search-movie [name]',
  describe: 'Search a movie in The Movie Database',
  builder: {
    multiple: {
      alias: 'm',
      describe: 'Return multiple results',
      type: 'boolean'
    }
  },
  handler: async (argv) => {
    const results = await searchMovies(argv.name, argv.multiple)

    if (Array.isArray(results)) {
      console.log(results.join('\n'))
    } else {
      console.log(results)
    }
  }
}
