import { throttle } from 'lodash'
import MinecraftData from 'minecraft-data'
import { Bot } from 'mineflayer'
import { fromEvent } from 'rxjs'
import { log } from './helpers'

export function survive(bot: Bot) {
  const foods = MinecraftData(bot.version).foodsArray.sort(
    (a, b) => b.effectiveQuality - a.effectiveQuality
  )
  const foodNames = foods.map((food) => food.name)

  fromEvent(bot, 'health')
  .subscribe(async () => {
    log(
      `My health is: ${bot.health}; food ${bot.food}, sat ${bot.foodSaturation}`
    )
    if (bot.food === 20) return
    if (bot.health < 12 || bot.food < 8) {
      const bestFood = bot.inventory
        .items()
        .filter((item) => foodNames.includes(item.name))
        .sort((a, b) =>
          foodNames.indexOf(a.name) < foodNames.indexOf(b.name) ? 1 : -1
        )
        .pop()

      if (bestFood) {
        log(`Eating ${bestFood.displayName} (${bestFood.count})`)
        bot.equip(bestFood, 'hand')
        try {
          await bot.consume()
        } catch (err) {
          log((err as Error)?.message)
        }
      } else {
        bot.chat('I haz no food.')
      }
    }
  })
}
