'use strict'

const commander = require('commander')
const bot = require('./commands/bot')

commander
    .version('1.0.0')
    .description('TomoChain Market Marker')

commander
    .command('bot <pair>')
    .action(async (pair) => {
        await bot.run(pair)
    })

commander.parse(process.argv)
