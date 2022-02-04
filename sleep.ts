import { Bot } from 'mineflayer'

import { log } from './helpers'

export async function sleep(bot: Bot) {
  if (bot.isSleeping) return // log('ALSZOM MAR')
  if (bot.time.isDay) return // log('NAPPAL VAN')

  const beds = bot.findBlocks({
    matching: block => block.name.endsWith('_bed'),
    maxDistance: 32,
    count: Infinity,
  })

  log(beds.length ? `Found ${beds.length} beds nearby.` : 'No beds found nearby.')

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

