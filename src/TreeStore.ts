export interface TreeStoreItem {
  id: number | string
  parent: number | string | null
}

export class TreeStore<T extends TreeStoreItem = TreeStoreItem> {
  private items: Map<T['id'], T> = new Map<T['id'], T>()

  private itemsConnections: Map<T['id'], T[]> = new Map()

  constructor(items: T[]) {
    items.forEach((item) => {
      this.items.set(item.id, item)
      this.addConnection(item)
    })
  }

  getAll() {
    return Array.from(this.items.values())
  }

  getItem(id: T['id']) {
    return this.items.get(id)
  }

  getChildren(id: T['id']) {
    return this.itemsConnections.get(id) || []
  }

  getAllChildren(id: T['id']) {
    const result: T[] = []
    const children = this.itemsConnections.get(id)
    if (!children) return result

    result.push(...children)

    for (const item of result) {
      const nested = this.itemsConnections.get(item.id)
      if (nested) result.push(...nested)
    }
    return result
  }

  getAllParents(id: T['id']) {
    const result = []
    const visited = new Set<TreeStoreItem['id']>()
    let current = this.items.get(id)

    while (current && !visited.has(current.id)) {
      visited.add(current.id)
      result.push(current)
      current = current.parent === null ? undefined : this.items.get(current.parent)
    }
    return result
  }

  setItems(items: T[]) {
    this.items.clear()
    this.itemsConnections.clear()
    items.forEach((item) => {
      this.items.set(item.id, item)
      this.addConnection(item)
    })
  }

  addItem(item: T) {
    if (this.items.has(item.id)) {
      console.error(`Item ${item.id} already exists`)
      return
    }
    this.items.set(item.id, item)
    this.addConnection(item)
  }

  removeItem(id: T['id']) {
    const item = this.items.get(id)
    if (!item) return

    const childrenToRemove = this.getAllChildren(id)
    for (const child of childrenToRemove) {
      this.items.delete(child.id)
      this.itemsConnections.delete(child.id)
    }

    this.removeConnection(item)
    this.items.delete(id)
    this.itemsConnections.delete(id)
  }

  updateItem(item: T) {
    const itemToUpdate = this.items.get(item.id)
    if (!itemToUpdate) return

    if (itemToUpdate.parent && itemToUpdate.parent === item.parent) {
      const siblings = this.itemsConnections.get(itemToUpdate.parent)
      if (siblings) {
        const idx = siblings.indexOf(itemToUpdate)
        if (idx !== -1) siblings[idx] = item
      }
    } else {
      this.removeConnection(itemToUpdate)
      this.addConnection(item)
    }
    this.items.set(item.id, item)
  }

  private addConnection(item: T) {
    if (item.parent) {
      const children = this.itemsConnections.get(item.parent)
      if (children) {
        children.push(item)
      } else {
        this.itemsConnections.set(item.parent, [item])
      }
    }
  }

  private removeConnection(item: T) {
    if (item.parent) {
      const children = this.itemsConnections.get(item.parent)
      if (children) {
        const itemIndex = children.indexOf(item)
        if (itemIndex !== -1) children.splice(itemIndex, 1)
        if (children.length === 0) this.itemsConnections.delete(item.parent)
      }
    }
  }
}
