import mineflayer, { Bot } from 'mineflayer'

import { sleep } from './sleep'

import config from './config'

const HELP = `I am a bot. Try #{help|sleep|quit}.`

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

main()
