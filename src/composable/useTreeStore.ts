import { computed, ref } from 'vue'
import { TreeStore, type TreeStoreItem } from '@/TreeStore.ts'

export function useTreeStore<T extends TreeStoreItem = TreeStoreItem>(initial: T[] = []) {
  const store = new TreeStore<T>(initial)
  const version = ref(0)
  const touch = () => {
    version.value++
  }

  const items = computed(() => {
    void version.value
    return store.getAll()
  })

  return {
    store,
    items,
    setItems(newItems: T[]) {
      store.setItems(newItems)
      touch()
    },
    addItem(item: T) {
      store.addItem(item)
      touch()
    },
    removeItem(id: T['id']) {
      store.removeItem(id)
      touch()
    },
    updateItem(item: T) {
      store.updateItem(item)
      touch()
    },
  }
}
