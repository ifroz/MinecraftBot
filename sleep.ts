import { Bot } from 'mineflayer'

import { log } from './helpers'

export async function sleep(bot: Bot): Promise<string> {
  if (bot.isSleeping) return 'Already sleeping'
  if (bot.time.isDay) return 'It is daytime'

  const beds = bot.findBlocks({
    matching: block => block.name.endsWith('purple_bed'),
    maxDistance: 32,
    count: Infinity,
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

