import { Bot, BotEvents } from 'mineflayer'
import { filter, fromEvent } from 'rxjs'

export const omitChatMessagesFromUser = (omittedUsername: string) =>
  filter<Parameters<BotEvents['chat']>>(
    ([username]) => username !== omittedUsername
  )
export const filterChatCommand = (commandString: string) =>
  filter<Parameters<BotEvents['chat']>>(([, message]) =>
    message.includes(commandString)
  )

export const getChatFeed = (bot: Bot) =>
  fromEvent<Parameters<BotEvents['chat']>>(bot, 'chat')

export const getIncomingChatFeed = (bot: Bot) =>
  getChatFeed(bot).pipe(omitChatMessagesFromUser(bot.username))

export const getChatCommandFeed = (bot: Bot, command: string) => 
  getIncomingChatFeed(bot).pipe(filterChatCommand(command))
