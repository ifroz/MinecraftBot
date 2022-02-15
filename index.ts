/// <reference types="./typings" />

import mineflayer from 'mineflayer'
import { pathfinder } from 'mineflayer-pathfinder'
import { mineflayer as prismarineViewer } from 'prismarine-viewer'

import { first, fromEvent, interval } from 'rxjs'

import { followPlayer } from './actions/follow'
import { sleep } from './actions/sleep'

import { paperFarming } from './behavior/paper'
import { survive } from './behavior/survive'

import config from './config'

import { Chat } from './lib/chat'

import { dump, log } from './lib/helpers'

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
      
      survive(bot)

      // prismarineViewer(bot, { firstPerson: true, port: 3333 })

      bot.chat(chat.help())
      bot.on('playerJoined', (player) => {
        bot.whisper(player.username, chat.help())
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

  // interval(15e3).subscribe(async () => {
  //   if (bot.time.isDay || bot.isSleeping) return
  //   log(await sleep(bot))
  // })

  chat.command('#paper').subscribe(() => paperFarming(bot))
  chat.command('#follow').subscribe(([username]) => followPlayer(bot, username))
  chat.command('#stop').subscribe(() => bot.pathfinder.stop())
}

main()
