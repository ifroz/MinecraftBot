import MinecraftData from 'minecraft-data'
import { Bot, Chest } from 'mineflayer'
import { goals, Movements } from 'mineflayer-pathfinder'
import { Block } from 'prismarine-block'
import { Vec3 } from 'vec3'
import { groupBy } from 'lodash'

import config from '../config'
import { log, wait } from '../lib/helpers'

const aggregateItemCount = (sum: number, { count }: Record<'count', number>) =>
  count + sum

const getInventoryItems = (bot: Bot, itemName: string) =>
  bot.inventory.items().filter(({ name }) => name === itemName)
const countInventoryItems = (bot: Bot, itemName: string) =>
  getInventoryItems(bot, itemName).reduce(aggregateItemCount, 0)

const logRelevantItems = (bot: Bot, message = '') =>
  log(
    `${message} I have ${countInventoryItems(
      bot,
      'sugar_cane'
    )} sugar canes and ${countInventoryItems(bot, 'paper')} paper.`
  )

export async function paperFarming(bot: Bot) {
  const mcData = MinecraftData(bot.version)
  const movements = new Movements(bot, mcData)
  movements.canDig = false
  movements.scafoldingBlocks = []
  bot.pathfinder.setMovements(movements)
  try {
    await bot.pathfinder.goto(
      new goals.GoalBlock(...(config.places.paper as [number, number, number]))
    )
  } catch (err) {
    log((err as Error)?.message)
    return
  }

  logRelevantItems(bot, 'Start.')

  await withdrawNearby(bot, 'sugar_cane', 3)

  logRelevantItems(bot, 'Withdrawn.')

  await craftItem(bot, mcData.findItemOrBlockByName('paper').id)

  logRelevantItems(bot, 'Crafted.')

  await depositNearby(bot, 'paper')

  if ((await checkSugarCane(bot)) >= 0.5) {
    bot.chat('Collecting sugar cane...')
    const button = config.places.sugarCaneButton as [number, number, number]
    await bot.pathfinder.goto(new goals.GoalBlock(...button))
    const block = bot.blockAt(new Vec3(...button))
    bot.activateBlock(block as Block)
  }

  logRelevantItems(bot, 'Done.')

  await wait(250)
  paperFarming(bot) // recursion
}

const findNearbyChests = (bot: Bot) =>
  bot.findBlocks({
    matching: (block) => block.name === 'chest',
    maxDistance: 12,
    count: 32,
  })

const findNearbySugarCane = (bot: Bot) =>
  bot.findBlocks({
    matching: (block) => block.name === 'sugar_cane',
    maxDistance: 12,
    count: 128,
  })

async function craftItem(bot: Bot, itemId: number) {
  const craftingTable = bot.findBlock({
    matching: (block) => block.name === 'crafting_table',
  })

  const recipes = bot.recipesFor(itemId, null, 1, craftingTable)

  if (recipes.length) {
    try {
      const amount = countInventoryItems(bot, 'sugar_cane')
      log(`Crafting ${amount}?...`)
      await bot.craft(
        recipes[0],
        Math.floor(amount / 3),
        craftingTable as Block
      )
    } catch (err) {
      log((err as Error)?.message)
    }
  } else {
    log('No sugar cane to craft.')
  }
}

async function withdrawNearby(bot: Bot, itemName: string, take: number) {
  const chestCoords = findNearbyChests(bot)

  if (take <= 0) {
    log(`Trying to take ${take}.`)
    return
  }
  for (const vec3 of chestCoords) {
    type ContainerChest = Chest & { containerItems: typeof chest.items }
    const chestBlock = bot.blockAt(vec3) as Block
    if (chestBlock.getProperties().type === 'right') continue
    const chest = await bot.openChest(chestBlock)
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
          if (take <= 0) return
        } catch (err) {
          log(err)
        }
        break
      }
      await new Promise((resolve) => setTimeout(resolve, 500))
    } 
    
    if (take <= 0) {
      log(`Trying to take ${take}.`)
      return
    }
  }
}

async function depositNearby(bot: Bot, itemName: string) {
  let amount = countInventoryItems(bot, itemName)
  let gave = 0
  for (const vec3 of findNearbyChests(bot)) {
    if (gave >= amount) return
    type ContainerChest = Chest & { containerItems: typeof chest.items }
    const chest = await bot.openChest(bot.blockAt(vec3) as Block)

    const chestItems = (chest as ContainerChest)
      .containerItems()
      .filter((item) => item.name === itemName) // already has similar items in it

    if (chestItems.length) {
      const { type, metadata } = chestItems[0]
      try {
        await chest.deposit(type, metadata, amount)
        gave += amount
        log(`Deposited ${amount} ${itemName} to chest ${vec3}.`)
      } catch (err) {
        log(err)
      }
    }
  }
}

type Coordinate = Record<'x' | 'y' | 'z', number>
async function checkSugarCane(bot: Bot) {
  const sugarCaneCoords = findNearbySugarCane(bot)
  const columnGroups = groupBy(
    sugarCaneCoords,
    ({ x, z }: Coordinate) => `${x} ${z}`
  )
  const percentage = Object.values(columnGroups).reduce(
    (acc, column, idx, array) => acc + column.length / 3 / array.length,
    0
  )
  log(`Sugar cane readiness:`, percentage)
  return percentage
}
