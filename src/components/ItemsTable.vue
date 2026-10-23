<template>
  <spinner-loader v-if="isLoading" />
  <ag-grid-vue
    class="tree-table"
    v-else
    :column-defs="columns"
    :row-data="rows"
    :get-row-id="getRowId"
    :row-height="56"
    tree-data-display-type="custom"
    tree-data-parent-id-field="parent"
    tree-data
    @grid-ready="onGridReady"
    @model-updated="refreshNumbers"
  />
</template>
<script setup lang="ts">
import { AgGridVue } from 'ag-grid-vue3'
import { computed, onMounted, ref, shallowRef } from 'vue'
import { ModuleRegistry } from 'ag-grid-community'
import { AllEnterpriseModule } from 'ag-grid-enterprise'
import { getItems, type Item } from '@/api/items.ts'
import SpinnerLoader from '@/components/SpinnerLoader.vue'
import type { ColDef, GetRowIdParams, GridReadyEvent, GridApi } from 'ag-grid-community'
import { useTreeStore } from '@/composable/useTreeStore.ts'

ModuleRegistry.registerModules([AllEnterpriseModule])

const isLoading = ref(false)

const { items, setItems } = useTreeStore<Item>([])

interface GridRow {
  id: string
  parent?: string
  label: string
}

const columns: ColDef<GridRow>[] = [
  {
    headerName: '№ п\\п',
    colId: 'num',
    valueGetter: (p) => (p.node?.rowIndex == null ? '' : p.node.rowIndex + 1),
  },

  {
    headerName: 'Категория',
    colId: 'category',
    flex: 1,
    showRowGroup: true,
    cellRenderer: 'agGroupCellRenderer',
    cellRendererParams: { suppressCount: true },
    valueGetter: (p) => (p.node?.group ? 'Группа' : 'Элемент'),
  },
  {
    headerName: 'Наименование',
    field: 'label',
    flex: 2,
  },
]

const rows = computed<GridRow[]>(() =>
  items.value.map((i) => ({
    id: String(i.id),
    parent: i.parent === null ? undefined : String(i.parent),
    label: i.label,
  })),
)

const getRowId = (params: GetRowIdParams<GridRow>) => params.data.id

const gridApi = shallowRef<GridApi<GridRow>>()

function onGridReady(e: GridReadyEvent<GridRow>) {
  gridApi.value = e.api
}

function refreshNumbers() {
  gridApi.value?.refreshCells({ columns: ['num'], force: true })
}

onMounted(async () => {
  try {
    isLoading.value = true
    const data = await getItems()
    setItems(data)
  } catch (e) {
    console.error(e)
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped lang="scss">
.tree-table {
  height: 100%;
}
</style>
