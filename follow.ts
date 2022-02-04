import { Bot } from "mineflayer"
import { Movements, goals } from "mineflayer-pathfinder"
import getMinecraftData from 'minecraft-data'

export function followPlayer(bot: Bot, username: string) {
  // init
  const mcData = getMinecraftData(bot.version)
  const movements = new Movements(bot, mcData)
  movements.canDig = false

  bot.pathfinder.setMovements(movements)
  // end init 

  bot.pathfinder.setGoal(
    new goals.GoalFollow(bot.players[username]?.entity, 1),
    true
  )
}
