import { Bot } from 'mineflayer'

import { log } from '../helpers'

export async function sleep(bot: Bot): Promise<string> {
  if (bot.isSleeping) return 'Already sleeping'
  if (bot.time.isDay) return 'It is daytime'
  if (bot.game.dimension !== 'minecraft:overworld') 
    return `I'd rather not sleep in the ${bot.game.dimension.split(':').pop()}...`

  const beds = bot.findBlocks({
    matching: block => block.name.endsWith('_bed'),
    maxDistance: 16,
    count: 4,
  })

  log(beds.length ? `Found ${beds.length} beds nearby.` : 'No beds found nearby.')
  if (!beds.length) return `Cannot find any beds nearby.`

  for (const vec3 of beds) {
    const bed = bot.blockAt(vec3)
    if (!bed) continue

    try {
      await bot.sleep(bed)
      log(`Sleeping at ${vec3}`)
      return 'Seemingly sleeping.'
    } catch (err) {
      log(`Cannot sleep at ${vec3}: ${err}`)
    }
  }

  return `I just cannot sleep in any of the ${beds.length} beds I found.`
}

