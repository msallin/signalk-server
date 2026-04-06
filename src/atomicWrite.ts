import fs from 'fs'

/**
 * Simple async mutex for serializing operations across event-loop ticks.
 * Prevents concurrent read-modify-write races on shared resources.
 */
export class AsyncMutex {
  private queue: Promise<void> = Promise.resolve()

  /**
   * Run fn exclusively — concurrent calls are queued and executed one at a time.
   */
  run<T>(fn: () => Promise<T>): Promise<T> {
    let resolve!: (v: T) => void
    let reject!: (e: unknown) => void
    const result = new Promise<T>((res, rej) => {
      resolve = res
      reject = rej
    })
    this.queue = this.queue.then(() => fn().then(resolve, reject))
    return result
  }
}

export function atomicWriteFileSync(filePath: string, data: string): void {
  const tmp = filePath + '.tmp'
  try {
    fs.writeFileSync(tmp, data)
    fs.renameSync(tmp, filePath)
  } catch (err) {
    try {
      fs.unlinkSync(tmp)
    } catch {}
    throw err
  }
}

export async function atomicWriteFile(
  filePath: string,
  data: string
): Promise<void> {
  const tmp = filePath + '.tmp'
  try {
    await fs.promises.writeFile(tmp, data)
    await fs.promises.rename(tmp, filePath)
  } catch (err) {
    try {
      await fs.promises.unlink(tmp)
    } catch {}
    throw err
  }
}
