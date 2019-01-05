#!/usr/bin/env node
const yargs = require('yargs')

yargs.strict()
  .scriptName('home-lab')
  .alias('help', 'h')
  .alias('version', 'v')
  .demandCommand(1)
  .commandDir('./commands')
  .fail((msg, err, yargs) => {
    if (err) {
      console.error(err)
      console.log()
      process.exit(1)
      return
    }
    console.log(msg)
    console.log()
    yargs.showHelp()
  })
  .wrap(null)
  .parse()
