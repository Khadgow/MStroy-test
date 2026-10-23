import type { TreeStoreItem } from '@/TreeStore.ts'
import { sleep } from '@/utils/sleep.ts'

const ITEMS_URL = '/mockItems.json'
const DELAY_MS = 2000

export interface Item extends TreeStoreItem {
  label: string
}

export async function getItems(): Promise<Item[]> {
  const [response] = await Promise.all([fetch(ITEMS_URL), sleep(DELAY_MS)])

  if (!response.ok) {
    throw new Error(`Failed to load items: ${response.status} ${response.statusText}`)
  }
  return (await response.json()) as Item[]
}
