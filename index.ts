import mineflayer, { Bot } from 'mineflayer'
import { Block } from 'prismarine-block'
// import getPrismarineRegistry from 'prismarine-registry'

import config from './config'

const log = (...payload: any[]) => console.log(...payload)

async function main() {
  const bot = mineflayer.createBot({
    host: config.host,
    username: config.user,
    port: config.port,
  } as any)

  bot.on('spawn', () => {
    bot.chat(`Hello, my dear humans.`)

    sleep(bot)
    exitOnChatMessage(bot)
  })
}

async function sleep(bot: Bot) {
  const beds = bot.findBlocks({
    matching: (b: Block) => !!b.name.match(/bed$/g),
    maxDistance: 128,
    count: 8,
  })

  log(beds.length ? `Found ${beds.length} beds.` : 'Nope, found no beds.')

  const errors: any[] = []
  for (const bed of beds) {
    try {
      await new Promise<void>((resolve, reject) => 
        bot.sleep(
          bot.blockAt(bed) as Block, 
          (err) => err ? reject(err) : resolve())
        )
      log('Sleeping???', bot.isSleeping)
      if (bot.isSleeping) {
        bot.chat(`ZzzZz....`)
      }
      return true
    } catch (err) {
      log('Failed to sleep', (err as Error).message)
    }
  }

  bot.chat(`Failed to sleep: \n${errors.map((err) => err.message).join('\n')}`)
}

function exitOnChatMessage(bot: Bot, messageString = '#exit') {
  bot.on('message', (chatMessage) => {
    if (chatMessage.toString().includes(messageString)) {
      bot.chat("See y'all!")
      setImmediate(() => bot.end('Bye.'))
    }
  })
}

main()
