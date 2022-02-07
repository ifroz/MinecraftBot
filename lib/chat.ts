import { Bot, BotEvents } from 'mineflayer'
import { filter, fromEvent } from 'rxjs'

import config from '../config'

type MessageArgs = Parameters<BotEvents['chat']>

export const filterTextMessages = () =>
  filter<MessageArgs>(([, , translate]) =>
    ['chat.type.text', 'commands.message.display.incoming'].includes(
      translate as string
    )
  )

export const omitUser = (omittedUsername: string) =>
  filter<MessageArgs>(([username]) => username !== omittedUsername)

export const filterChatCommand = (commandString: string) =>
  filter<MessageArgs>(([, message]) => message.includes(commandString))

type Feed = ReturnType<typeof getChatFeed>

export const getChatFeed = (bot: Bot) => fromEvent<MessageArgs>(bot, 'chat')

export const getIncomingChatFeed = (bot: Bot) =>
  getChatFeed(bot).pipe(omitUser(config.user))

export const getChatCommandFeed = (bot: Bot, command: string) =>
  getIncomingChatFeed(bot)
    .pipe(filterTextMessages())
    .pipe(filterChatCommand(command))

interface Command {
  command: string
  description: string
  feed: Feed
}

export class Chat {
  private commands: Command[] = []
  constructor(private readonly bot: Bot) {}

  command(command: string, description: string = '...') {
    const feed = getChatCommandFeed(this.bot, command)
    this.commands.push({ command, description, feed })
    return feed
  }

  help() {
    return `I am a bot.\nTry one of ${this.commands
      .map(({ command }) => command)
      .join(' ')}`
  }
}
