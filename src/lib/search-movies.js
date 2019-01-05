const querystring = require('querystring')
const _ = require('lodash')
const fetch = require('node-fetch')

const homeLabConfig = require('./get-config')

function parseOne (result) {
  if (result) {
    const title = _.get(result, 'title')
    const year = _.first(_.get(result, 'release_date').split('-'))
    return _.trim(title + ' (' + year + ')')
  }
  return ''
}

function parseMultiple (results) {
  return results.map(parseOne)
}

async function searchMovies (nameOrPath, multiple = false) {
  const segments = _.last(nameOrPath.split('/')).split(/\d{4}/)
  const name = _.first(segments).replace(/\./g, ' ')

  const qs = {
    query: name,
    api_key: homeLabConfig.tmdbKey,
    page: 1,
    include_adult: true
  }

  const res = await fetch(`https://api.themoviedb.org/3/search/movie?${querystring.stringify(qs)}`)
  const json = await res.json()

  const results = parseMultiple(json.results)

  if (!multiple) {
    return _.first(results)
  }

  return results
}

module.exports = searchMovies
