import { Bot } from 'mineflayer'
import { Block } from 'prismarine-block'

import { log } from './helpers'

export async function sleep(bot: Bot) {
  const beds = bot.findBlocks({
    matching: (b: Block) => !!b.name.match(/bed$/g),
    maxDistance: 128,
    count: 8,
  })

  log(beds.length ? `Found ${beds.length} beds.` : 'No beds found.')

  for (const vec3 of beds) {
    const bed = bot.blockAt(vec3)
    if (!bed) continue

    try {
      await bot.sleep(bed)

      log('Sleeping?', bot.isSleeping)
      if (bot.isSleeping) {
        bot.chat(`ZzzZz....`)
        return
      } else {
        bot.chat(`ZzzZz.... (hopefully, something seems off)`)
      }
    } catch (err) {
      const message = `Insomnia: ${(err as Error)?.message}`
      log('Insomnia: ', message)
    }
  }

  if (!beds.length) {
    bot.chat(`Insomnia: No beds found.`)
  }
}

