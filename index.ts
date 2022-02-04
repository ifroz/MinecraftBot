import mineflayer, { Bot } from 'mineflayer'
import { Block } from 'prismarine-block'
// import getPrismarineRegistry from 'prismarine-registry'

import config from './config'

const log = (msg: any, ...payload: any[]) => 
  console.log(msg, ...payload.map(p => JSON.stringify(p)))

const wait = (ms: number = 1000) => 
  new Promise<void>((resolve) => setTimeout(resolve, ms))

const HELP = `I am a bot. Try #{help|sleep|quit}`

async function main() {
  const bot = mineflayer.createBot({
    host: config.host,
    username: config.user,
    port: config.port,
  } as any)

  bot.on('spawn', async () => {
    onChatMessage(bot, '#quit', () => quit(bot))
    onChatMessage(bot, '#sleep', () => sleep(bot))
    onChatMessage(bot, '#help', (username) => bot.whisper(username, HELP))

    bot.chat(HELP)

    bot.on('playerJoined', (player) => {
      bot.whisper(player.username, HELP)
    })
  })
}

type Action = (username: string) => void | Promise<void>
function onChatMessage(bot: Bot, message: string, action: Action) {
  bot.on('chat', async (username, chatMessage) => {
    if (chatMessage.toString().includes(message)) {
      try {
        await action(username)
      } catch (err) {
        bot.chat(`Failed to ${message}: ${(err as Error)?.message}`)
      }
    }
  })
}

function quit(bot: Bot) {
  bot.chat("See y'all!")
  bot.quit()
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
    }
  }

  if (!beds.length) {
    bot.chat(`Insomnia: No beds found.`)
  }
}

main()
