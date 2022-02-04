import mineflayer, { Bot } from 'mineflayer'
import config from './config'

async function main() {
  const bot = mineflayer.createBot({
    host: config.host,
    username: config.user,
    port: config.port,
  } as any)

  bot.on('login', () => {
    exitOnChatMessage(bot)

    bot.chat(`Hello, my dear humans.`)
  })
}

function exitOnChatMessage(bot: Bot, messageString = '#exit') {
  bot.on('message', (chatMessage) => {
    if (chatMessage.toString().includes(messageString)) {
      bot.chat("See y'all!")
      setImmediate(() => bot.end('Bye.'))
    }
  })
}

main()
