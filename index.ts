import mineflayer from 'mineflayer'
import config from './config'

async function main() {
  const bot = mineflayer.createBot({
    host: config.host,
    username: config.user,
    port: config.port,
  } as any)

  bot.on('login', () => {
    bot.chat('Hello, my dear humans. ')
  })

  // bot.on('message', chatMessage => {})
}

main()