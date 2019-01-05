const _ = require('lodash')
const fetch = require('node-fetch')

const homeLabConfig = require('./get-config')

async function bandwidth () {
  const res = await fetch('https://api.teksavvy.com/web/Usage/UsageSummaryRecords?$filter=IsCurrent%20eq%20true', {
    method: 'get',
    headers: {
      'TekSavvy-APIKey': homeLabConfig.teksavvyKey
    }
  })
  const json = await res.json()
  return _.last(json.value)
}

module.exports = bandwidth
