'use strict'

const commander = require('commander')
const bot = require('./commands/bot')
const lend = require('./commands/lend')
const price = require('./commands/price')
const wall = require('./commands/wall')

commander
    .version('1.0.0')
    .description('TomoChain Market Marker')

commander
    .command('bot <pair>')
    .action(async (pair) => {
        await bot.run(pair)
    })

commander
    .command('lend <pair>')
    .action(async (pair) => {
        await lend.run(pair)
    })

commander
    .command('price')
    .action(async () => {
        await price.run()
    })

commander
    .command('wall <pair>')
    .action(async (pair) => {
        await wall.run(pair)
    })

commander.parse(process.argv)
