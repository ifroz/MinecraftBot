/// <reference types="./typings" />

import mineflayer, { Bot, Chest } from 'mineflayer'
import { goals, Movements, pathfinder } from 'mineflayer-pathfinder'
import { mineflayer as prismarineViewer } from 'prismarine-viewer'
import { Block } from 'prismarine-block'

import MinecraftData from 'minecraft-data'

import { first, fromEvent, interval } from 'rxjs'

import { followPlayer } from './actions/follow'
import { sleep } from './actions/sleep'

import config from './config'

import { Chat } from './chat'
import { survive } from './survive'

import { dump, log } from './helpers'

const STACK = 64

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

  chat.command('#paper').subscribe(async function paperFarming() {
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

    const findNearbyChests = () =>
      bot.findBlocks({
        matching: (block) => block.name === 'chest',
        maxDistance: 12,
        count: 32,
      })

    async function depositNearby(bot: Bot, itemName: string) {
      for (const vec3 of findNearbyChests()) {
        type ContainerChest = Chest & { containerItems: typeof chest.items }
        const chest = await bot.openChest(bot.blockAt(vec3) as Block)

        const items = (chest as ContainerChest)
          .containerItems()
          .filter((item) => item.name === itemName) // already has similar items in it

        if (items.length) {
          try {
            await chest.deposit(
              items[0].type,
              items[0].metadata,
              items[0].count
            )
            console.log(`Deposited ${items[0].count}`)
          } catch (err) {
            log(err)
          }
        }
      }
    }

    async function withdrawNearby(bot: Bot, itemName: string, take: number) {
      const chestCoords = findNearbyChests()

      for (const vec3 of chestCoords) {
        type ContainerChest = Chest & { containerItems: typeof chest.items }
        const chest = await bot.openChest(bot.blockAt(vec3) as Block)
        const items = (chest as ContainerChest)
          .containerItems()
          .filter((item) => item.name === itemName)
      }

      if (take <= 0) return
      for (const vec3 of chestCoords) {
        type ContainerChest = Chest & { containerItems: typeof chest.items }
        const chest = await bot.openChest(bot.blockAt(vec3) as Block)
        const items = (chest as ContainerChest)
          .containerItems()
          .filter((item) => item.name === itemName)

        if (take > 0) {
          for (const item of items) {
            try {
              const withdrawn = Math.min(item.count, take, 64)
              await chest.withdraw(item.type, item.metadata, withdrawn)
              log(`Withdrawn ${withdrawn} ${item.displayName}.`)
              take -= item.count
              if (take <= 0) break
            } catch (err) {
              log(err)
            }
            break
          }
          await new Promise((resolve) => setTimeout(resolve, 500))
        }
      }
    }

    const sugarCanes = bot.inventory
      .items()
      .filter(({ name }) => name === 'sugar_cane')
    const sugarCaneCount = sugarCanes.reduce((sum, { count }) => sum + count, 0)
    await withdrawNearby(bot, 'sugar_cane', 3 * STACK - sugarCaneCount)

    const craftingTable = bot.findBlock({
      matching: (block) => block.name === 'crafting_table',
    })

    const recipes = bot.recipesFor(
      mcData.findItemOrBlockByName('paper').id,
      null,
      1,
      craftingTable
    )

    if (recipes.length) {
      try {
        const amount = Math.min(64, Math.floor(sugarCaneCount / 3))
        log(`Crafting ${amount}...`)
        await bot.craft(recipes[0], amount, craftingTable as Block)
      } catch (err) {
        log((err as Error)?.message)
      }
    } else {
      log('No sugar cane to craft.')
    }

    await depositNearby(bot, 'paper')

    setTimeout(paperFarming, 30e3)
  })
  chat.command('#follow').subscribe(([username]) => followPlayer(bot, username))
  chat.command('#stop').subscribe(() => bot.pathfinder.stop())
}

main()
