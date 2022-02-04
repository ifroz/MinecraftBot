export const log = (msg: any, ...payload: any[]) => 
  console.log(msg, ...payload.map(p => JSON.stringify(p)))

export const wait = (ms: number = 1000) => 
  new Promise<void>((resolve) => setTimeout(resolve, ms))

