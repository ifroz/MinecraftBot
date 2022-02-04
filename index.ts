import mineflayer, { Bot } from 'mineflayer'
import { Block } from 'prismarine-block'
// import getPrismarineRegistry from 'prismarine-registry'

import config from './config'

const log = (msg: any, ...payload: any[]) => 
  console.log(msg, ...payload.map(p => JSON.stringify(p)))

const wait = (ms: number = 1000) => 
  new Promise<void>((resolve) => setTimeout(resolve, ms))

async function main() {
  const bot = mineflayer.createBot({
    host: config.host,
    username: config.user,
    port: config.port,
  } as any)

  bot.on('spawn', async () => {
    await wait(2000)
    bot.chat(`[^_^] I am a bot.`)

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

  log(beds.length ? `Found ${beds.length} beds.` : 'No beds found.')

  for (const vec3 of beds) {
    const bed = bot.blockAt(vec3)
    if (!bed) continue

    try {
      await bot.sleep(bed)

      log('Sleeping?', bot.isSleeping)
      if (bot.isSleeping) {
        bot.chat(`ZzzZz....`)
        return
      } else {
        bot.chat(`ZzzZz.... (hopefully, something seems off)`)
      }
    } catch (err) {
      const message = `Insomnia: ${(err as Error)?.message}`
      log('Insomnia: ', message)
      bot.chat(`Insomnia: ${message}`)
    }
  }

  if (!beds.length) {
    bot.chat(`Insomnia: No beds found.`)
  }
}

function exitOnChatMessage(bot: Bot, messageString = '#exit') {
  bot.on('message', (chatMessage) => {
    if (chatMessage.toString().includes(messageString)) {
      exit(bot)
    }
  })
}

function exit(bot: Bot) {
  bot.chat("See y'all!")
  setImmediate(() => bot.end('Bye.'))
}

main()
