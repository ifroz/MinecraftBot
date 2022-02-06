/// <reference types="./typings" />

import mineflayer, { Bot, BotEvents } from 'mineflayer'
import { pathfinder } from 'mineflayer-pathfinder'
import { mineflayer as prismarineViewer } from 'prismarine-viewer'

import { first, fromEvent } from 'rxjs'

import { followPlayer } from './actions/follow'
import { sleep } from './actions/sleep'

import config from './config'

import { getChatCommandFeed } from './chat'

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

  const onChatMessage = (
    chatCommand: string,
    action: (args: Parameters<BotEvents['chat']>) => void
  ) => getChatCommandFeed(bot, chatCommand).subscribe(action)

  onChatMessage('#help', ([username]) => bot.whisper(username, HELP))
  onChatMessage('#quit', () => bot.quit())
  onChatMessage('#sleep', async ([username]) => {
    bot.whisper(username, await sleep(bot))
  })

  onChatMessage('#follow', ([username]) => followPlayer(bot, username))
  onChatMessage('#stop', () => bot.pathfinder.stop())
}

main()
