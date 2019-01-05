const colors = require('colors')

const teksavvyBandwidth = require('./../lib/teksavvy-bandwidth')

module.exports = {
  command: 'bandwidth',
  describe: 'Show the bandwidth usage from Teksavvy',
  handler: async (argv) => {
    const result = await teksavvyBandwidth()

    console.log(colors.green('ISP Bandwidth Usage'))
    console.log('From:', result.StartDate, 'to', result.EndDate)
    console.log('On Peak Upload:', result.OnPeakUpload, 'GiB')
    console.log('On Peak Download:', result.OnPeakDownload, 'GiB')
    console.log('Off Peak Upload:', result.OffPeakUpload, 'GiB')
    console.log('Off Peak Download:', result.OffPeakDownload, 'GiB')
    console.log('Total Bandwidth:', (result.OnPeakUpload + result.OnPeakDownload + result.OffPeakUpload + result.OffPeakDownload).toFixed(2), 'GiB')
  }
}
