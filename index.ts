/// <reference types="./typings" />

import mineflayer, { Chest, Furnace } from 'mineflayer'
import { goals, Movements, pathfinder } from 'mineflayer-pathfinder'
import { mineflayer as prismarineViewer } from 'prismarine-viewer'
import { Block } from 'prismarine-block'

import MinecraftData, { Item } from 'minecraft-data'

import { first, fromEvent, interval } from 'rxjs'

import { followPlayer } from './actions/follow'
import { sleep } from './actions/sleep'

import config from './config'

import { Chat } from './chat'
import { survive } from './survive'

import { dump, log } from './helpers'

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

  interval(15e3).subscribe(async () => {
    if (bot.time.isDay || bot.isSleeping) return
    log(await sleep(bot))
  })

  chat.command('#paper').subscribe(async () => {
    const mcData = MinecraftData(bot.version)
    const movements = new Movements(bot, mcData)
    movements.canDig = false
    // movements.scafoldingBlocks = []
    bot.pathfinder.setMovements(movements)
    try {
      await bot.pathfinder.goto(
        new goals.GoalBlock(
          ...(config.places.paper as [number, number, number])
        )
      )
    } catch (err) {
      log((err as Error)?.message)
    }
    bot.chat('Paper farming...')

    const chestCoords =
      [] ||
      bot.findBlocks({
        matching: (block) => block.name === 'chest',
        maxDistance: 12,
        count: 32,
      })

    let take = 3 * 64
    for (const vec3 of chestCoords) {
      type ContainerChest = Chest & { containerItems: typeof chest.items }
      const chest = await bot.openChest(bot.blockAt(vec3) as Block)
      const sugarCanes = (chest as ContainerChest)
        .containerItems()
        .filter((item) => item.name === 'sugar_cane')

      if (take > 0) {
        for (const sugarCane of sugarCanes) {
          try {
            const withdrawn = Math.min(sugarCane.count, take)
            await chest.withdraw(sugarCane.type, sugarCane.metadata, withdrawn)
            log(`Withdrawn ${withdrawn}`)
            take -= sugarCane.count
            if (take <= 0) break
          } catch (err) {
            log(err)
          }
          break
        }
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
      
    }

    const sugarCanes = bot.inventory
      .items()
      .filter((item) => item.name === 'sugar_cane')
    const sugarCaneCount = sugarCanes.reduce((sum, { count }) => sum + count, 0)
    dump(sugarCaneCount)

    const craftingTable = bot.findBlock({
      matching: (block) => block.name === 'crafting_table',
    })

    const recipes = bot.recipesFor(
      mcData.findItemOrBlockByName('paper').id,
      null,
      1,
      craftingTable
    )

    dump(recipes)

    if (recipes.length) {
      try {
        await bot.craft(
          recipes[0],
          Math.min(64, Math.floor(sugarCaneCount / 3)),
          craftingTable as Block
        )
      } catch (err) {
        log(err)
      }
    } else {
      log('No sugar cane to craft.')
    }
  })
  chat.command('#follow').subscribe(([username]) => followPlayer(bot, username))
  chat.command('#stop').subscribe(() => bot.pathfinder.stop())
}

main()
