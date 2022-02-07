export const dump = (payload: any) => console.log(JSON.stringify(payload, null, 2))
export const log = (msg: any, ...payload: any[]) => 
  console.log(msg, ...payload.map(p => JSON.stringify(p)))

export const wait = (ms: number = 1000) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))
