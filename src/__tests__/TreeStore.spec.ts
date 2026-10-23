import { beforeEach, describe, expect, it } from 'vitest'
import { TreeStore } from '@/TreeStore.ts'

type Row = { id: string | number; parent: string | number | null; label: string }

const makeItems = (): Row[] => [
  { id: 1, parent: null, label: 'Item 1' },

  { id: '91064cef', parent: 1, label: 'Item 2' },
  { id: 3, parent: 1, label: 'Item 3' },

  { id: 4, parent: '91064cef', label: 'Item 4' },
  { id: 5, parent: '91064cef', label: 'Item 5' },
  { id: 6, parent: '91064cef', label: 'Item 6' },

  { id: 7, parent: 4, label: 'Item 7' },
  { id: 8, parent: 4, label: 'Item 8' },
]

const ids = (list: Row[]) => list.map((i) => i.id)

describe('TreeStore', () => {
  let items: Row[]
  let store: TreeStore<Row>

  beforeEach(() => {
    items = makeItems()
    store = new TreeStore(items)
  })

  describe('getAll', () => {
    it('возвращает все элементы в исходном порядке', () => {
      expect(store.getAll()).toEqual(items)
    })

    it('для пустого хранилища возвращает пустой массив', () => {
      expect(new TreeStore<Row>([]).getAll()).toEqual([])
    })
  })

  describe('getItem', () => {
    it('возвращает сам объект элемента', () => {
      expect(store.getItem(4)).toBe(items[3])
    })

    it('находит элемент по строковому id', () => {
      expect(store.getItem('91064cef')).toBe(items[1])
    })

    it('различает числовой и строковый id', () => {
      expect(store.getItem('4')).toBeUndefined()
    })

    it('для несуществующего id возвращает undefined', () => {
      expect(store.getItem(999)).toBeUndefined()
    })
  })

  describe('getChildren', () => {
    it('возвращает только прямых потомков', () => {
      expect(ids(store.getChildren(1))).toEqual(['91064cef', 3])
      expect(ids(store.getChildren('91064cef'))).toEqual([4, 5, 6])
      expect(ids(store.getChildren(4))).toEqual([7, 8])
    })

    it('для элемента без потомков возвращает пустой массив', () => {
      expect(store.getChildren(3)).toEqual([])
      expect(store.getChildren(8)).toEqual([])
    })

    it('для несуществующего id возвращает пустой массив', () => {
      expect(store.getChildren(999)).toEqual([])
    })
  })

  describe('getAllChildren', () => {
    it('возвращает всех потомков до самого глубокого уровня', () => {
      expect(ids(store.getAllChildren(1)).sort()).toEqual(['91064cef', 3, 4, 5, 6, 7, 8].sort())
    })

    it('обходит дерево в ширину', () => {
      expect(ids(store.getAllChildren(1))).toEqual(['91064cef', 3, 4, 5, 6, 7, 8])
    })

    it('работает для промежуточного узла', () => {
      expect(ids(store.getAllChildren('91064cef'))).toEqual([4, 5, 6, 7, 8])
    })

    it('не включает сам элемент', () => {
      expect(ids(store.getAllChildren(4))).not.toContain(4)
    })

    it('для листа и несуществующего id возвращает пустой массив', () => {
      expect(store.getAllChildren(8)).toEqual([])
      expect(store.getAllChildren(999)).toEqual([])
    })
  })

  describe('getAllParents', () => {
    it('возвращает цепочку от самого элемента до корня в правильном порядке', () => {
      expect(ids(store.getAllParents(7))).toEqual([7, 4, '91064cef', 1])
    })

    it('для корня возвращает только его самого', () => {
      expect(ids(store.getAllParents(1))).toEqual([1])
    })

    it('для элемента первого уровня возвращает его и корень', () => {
      expect(ids(store.getAllParents(3))).toEqual([3, 1])
    })

    it('для несуществующего id возвращает пустой массив', () => {
      expect(store.getAllParents(999)).toEqual([])
    })

    it('не зацикливается на циклических данных', () => {
      const cyclic = new TreeStore<Row>([
        { id: 'a', parent: 'b', label: 'a' },
        { id: 'b', parent: 'a', label: 'b' },
      ])
      expect(ids(cyclic.getAllParents('a'))).toEqual(['a', 'b'])
    })

    it('обрывает цепочку, если родитель отсутствует в хранилище', () => {
      const orphan = new TreeStore<Row>([{ id: 2, parent: 100, label: 'orphan' }])
      expect(ids(orphan.getAllParents(2))).toEqual([2])
    })
  })

  describe('setItems', () => {
    it('полностью заменяет прежние данные', () => {
      store.setItems([{ id: 100, parent: null, label: 'New' }])

      expect(ids(store.getAll())).toEqual([100])
      expect(store.getItem(1)).toBeUndefined()
      expect(store.getChildren(1)).toEqual([])
      expect(store.getAllChildren(1)).toEqual([])
    })

    it('перестраивает связи между элементами', () => {
      store.setItems([
        { id: 'r', parent: null, label: 'root' },
        { id: 'c', parent: 'r', label: 'child' },
      ])
      expect(ids(store.getChildren('r'))).toEqual(['c'])
      expect(ids(store.getAllParents('c'))).toEqual(['c', 'r'])
    })

    it('принимает пустой массив', () => {
      store.setItems([])
      expect(store.getAll()).toEqual([])
    })
  })

  describe('addItem', () => {
    it('добавляет элемент в общую структуру', () => {
      const item: Row = { id: 9, parent: 3, label: 'Item 9' }
      store.addItem(item)

      expect(store.getItem(9)).toBe(item)
      expect(store.getAll()).toHaveLength(9)
      expect(ids(store.getChildren(3))).toEqual([9])
    })

    it('новый элемент попадает в getAllChildren и getAllParents', () => {
      store.addItem({ id: 9, parent: 8, label: 'Item 9' })

      expect(ids(store.getAllChildren(1))).toContain(9)
      expect(ids(store.getAllParents(9))).toEqual([9, 8, 4, '91064cef', 1])
    })

    it('добавляет в конец списка потомков', () => {
      store.addItem({ id: 9, parent: 1, label: 'Item 9' })
      expect(ids(store.getChildren(1))).toEqual(['91064cef', 3, 9])
    })

    it('добавляет новый корневой элемент', () => {
      store.addItem({ id: 'root2', parent: null, label: 'Root 2' })
      expect(store.getItem('root2')).toBeDefined()
      expect(ids(store.getAllParents('root2'))).toEqual(['root2'])
    })
  })

  describe('removeItem', () => {
    it('удаляет элемент вместе со всеми потомками', () => {
      store.removeItem(4)

      expect(ids(store.getAll())).toEqual([1, '91064cef', 3, 5, 6])
      expect(store.getItem(4)).toBeUndefined()
      expect(store.getItem(7)).toBeUndefined()
      expect(store.getItem(8)).toBeUndefined()
    })

    it('убирает элемент из списка потомков родителя', () => {
      store.removeItem(4)
      expect(ids(store.getChildren('91064cef'))).toEqual([5, 6])
    })

    it('очищает записи о потомках удалённых узлов', () => {
      store.removeItem(4)
      expect(store.getChildren(4)).toEqual([])
      expect(store.getAllChildren(4)).toEqual([])
    })

    it('удаление корня очищает всё дерево', () => {
      store.removeItem(1)
      expect(store.getAll()).toEqual([])
    })

    it('удаление листа не затрагивает остальные элементы', () => {
      store.removeItem(8)
      expect(ids(store.getAll())).toEqual([1, '91064cef', 3, 4, 5, 6, 7])
      expect(ids(store.getChildren(4))).toEqual([7])
    })

    it('для несуществующего id ничего не делает', () => {
      store.removeItem(999)
      expect(store.getAll()).toHaveLength(8)
    })

    it('после удаления id можно добавить снова', () => {
      store.removeItem(4)
      store.addItem({ id: 4, parent: 3, label: 'again' })

      expect(ids(store.getChildren(3))).toEqual([4])
      expect(store.getChildren(4)).toEqual([])
    })
  })

  describe('updateItem', () => {
    it('актуализирует элемент в хранилище', () => {
      const updated = { id: 5, parent: '91064cef', label: 'Changed' }
      store.updateItem(updated)

      expect(store.getItem(5)).toBe(updated)
      expect(store.getItem(5)?.label).toBe('Changed')
    })

    it('при том же родителе сохраняет позицию среди соседей', () => {
      const updated = { id: 5, parent: '91064cef', label: 'Changed' }
      store.updateItem(updated)

      expect(ids(store.getChildren('91064cef'))).toEqual([4, 5, 6])
      expect(store.getChildren('91064cef')[1]).toBe(updated)
      expect(store.getAll()[4]).toBe(updated)
    })

    it('при смене родителя переносит элемент вместе с поддеревом', () => {
      store.updateItem({ id: 4, parent: 3, label: 'Item 4' })

      expect(ids(store.getChildren('91064cef'))).toEqual([5, 6])
      expect(ids(store.getChildren(3))).toEqual([4])
      expect(ids(store.getAllChildren(3))).toEqual([4, 7, 8])
      expect(ids(store.getAllParents(7))).toEqual([7, 4, 3, 1])
    })

    it('позволяет сделать элемент корневым', () => {
      store.updateItem({ id: 3, parent: null, label: 'Item 3' })

      expect(ids(store.getChildren(1))).toEqual(['91064cef'])
      expect(ids(store.getAllParents(3))).toEqual([3])
    })

    it('не оставляет пустых записей, когда у прежнего родителя не осталось детей', () => {
      store.updateItem({ id: 3, parent: '91064cef', label: 'Item 3' })
      store.updateItem({ id: '91064cef', parent: null, label: 'Item 2' })

      expect(ids(store.getChildren(1))).toEqual([])
    })

    it('для несуществующего id ничего не делает', () => {
      store.updateItem({ id: 999, parent: null, label: 'ghost' })

      expect(store.getItem(999)).toBeUndefined()
      expect(store.getAll()).toHaveLength(8)
    })
  })
})
