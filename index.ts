import mineflayer, { Bot } from 'mineflayer'
import { pathfinder } from "mineflayer-pathfinder"

import { sleep } from './sleep'

import config from './config'
import { followPlayer } from './follow'

const HELP = `I am a bot. Try #{help|sleep|quit}.`

async function main() {
  const bot = mineflayer.createBot({
    host: config.host,
    username: config.user,
    port: config.port,
  } as any)

  bot.loadPlugin(pathfinder)

  bot.on('spawn', async () => {
    onChatMessage(bot, '#help', (username) => bot.whisper(username, HELP))
    onChatMessage(bot, '#quit', () => bot.quit())
    onChatMessage(bot, '#sleep', async (user) => {
      bot.whisper(user, await sleep(bot))
    })

    onChatMessage(bot, '#follow', (username) => followPlayer(bot, username))
    onChatMessage(bot, '#stop', () => bot.pathfinder.stop())

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

main()
