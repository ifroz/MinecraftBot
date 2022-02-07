/** Output payload as JSON string. */
export const dump = (payload: any) =>
  console.log(JSON.stringify(payload, null, 2))

/** Logs a message string or Error message with optional JSON payload. */
export const log = (msg: any, ...payload: any[]) =>
  console.log(
    `${msg instanceof Error ? msg.message : msg}`.trim(),
    ...payload.map((p) => JSON.stringify(p))
  )

export const wait = (ms: number = 1000) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))
