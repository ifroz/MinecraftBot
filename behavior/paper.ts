import MinecraftData from 'minecraft-data'
import { Bot, Chest } from 'mineflayer'
import { goals, Movements } from 'mineflayer-pathfinder'
import { Block } from 'prismarine-block'
import config from '../config'
import { log } from '../lib/helpers'

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
  // movements.scafoldingBlocks = []
  bot.pathfinder.setMovements(movements)
  try {
    await bot.pathfinder.goto(
      new goals.GoalBlock(...(config.places.paper as [number, number, number]))
    )
  } catch (err) {
    log((err as Error)?.message)
  }
  bot.chat('Paper farming...')

  logRelevantItems(bot, 'Start.')

  await withdrawNearby(bot, 'sugar_cane', 3)

  logRelevantItems(bot, 'Withdrawn.')

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
      // const amount = Math.min(64, Math.floor(sugarCaneCount / 3))
      const amount = countInventoryItems(bot, 'sugar_cane')
      log(`Crafting ${amount}?...`)
      await bot.craft(recipes[0], null, craftingTable as Block)
    } catch (err) {
      log((err as Error)?.message)
    }
  } else {
    log('No sugar cane to craft.')
  }

  logRelevantItems(bot, 'Crafted.')

  await depositNearby(bot, 'paper')


  logRelevantItems(bot, 'Done.')
}

const findNearbyChests = (bot: Bot) =>
  bot.findBlocks({
    matching: (block) => block.name === 'chest',
    maxDistance: 12,
    count: 32,
  })

async function withdrawNearby(bot: Bot, itemName: string, take: number) {
  const chestCoords = findNearbyChests(bot)

  for (const vec3 of chestCoords) {
    type ContainerChest = Chest & { containerItems: typeof chest.items }
    const chest = await bot.openChest(bot.blockAt(vec3) as Block)
    const items = (chest as ContainerChest)
      .containerItems()
      .filter((item) => item.name === itemName)
  }

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
        log(`Preposit`, amount)
        await chest.deposit(type, metadata, amount)
        gave += amount
        log(`Deposited ${amount} ${itemName} to chest ${vec3}.`)
      } catch (err) {
        log(err)
      }
    }
  }
}
