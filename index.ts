/// <reference types="./typings" />

import mineflayer, { Bot, BotEvents } from 'mineflayer'
import { pathfinder } from 'mineflayer-pathfinder'
import { mineflayer as prismarineViewer } from 'prismarine-viewer'

import { first, fromEvent } from 'rxjs'

import { followPlayer } from './actions/follow'
import { sleep } from './actions/sleep'

import config from './config'

import { Chat } from './chat'

const HELP = `I am a bot. Try #{help|sleep|quit}.`

async function main() {
  const bot = mineflayer.createBot({
    host: config.host,
    username: config.user,
    port: config.port,
  } as any)

  bot.loadPlugin(pathfinder)

  fromEvent(bot, 'spawn')
    .pipe(first())
    .subscribe(async () => {
      console.log('Spawned.')
      prismarineViewer(bot, { firstPerson: true, port: 3333 })

      bot.chat(HELP)

      bot.on('playerJoined', (player) => {
        bot.whisper(player.username, HELP)
      })
    })

  const chat = new Chat(bot)
  chat.command('#help').subscribe(([username]) => {
    bot.whisper(username, chat.help())
  })

  chat.command('#quit').subscribe(() => {
    bot.quit()
    process.exit(0)
  })

  chat.command('#sleep').subscribe(async ([username]) => {
    bot.whisper(username, await sleep(bot))
  })

  chat.command('#follow').subscribe(([username]) => followPlayer(bot, username))
  chat.command('#stop').subscribe(() => bot.pathfinder.stop())
}

main()
