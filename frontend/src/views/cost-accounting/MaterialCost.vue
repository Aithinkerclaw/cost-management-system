<template>
  <div class="material-cost">
    <el-card shadow="hover">
      <template #header>
        <span>📦 BOM材料成本明细</span>
        <el-select v-model="selectedProduct" placeholder="选择产品" size="small" style="width:200px;float:right" @change="loadData">
          <el-option label="全部产品" value="" />
          <el-option v-for="p in products" :key="p.id" :label="p.product_name" :value="p.id" />
        </el-select>
      </template>
      <el-table :data="list" stripe size="small">
        <el-table-column prop="product_name" label="产品名称" width="140" />
        <el-table-column prop="material_name" label="物料名称" />
        <el-table-column prop="quantity" label="用量" width="80" align="center" />
        <el-table-column prop="unit" label="单位" width="60" align="center" />
        <el-table-column prop="standard_price" label="标准单价(元)" width="110" align="right">
          <template #default="{ row }">{{ Number(row.standard_price).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="材料成本(元)" width="110" align="right">
          <template #default="{ row }">{{ (row.quantity * row.standard_price).toFixed(2) }}</template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { costApi } from '../../api/index'

const list = ref([])
const products = ref([{ id: '', product_name: '全部产品' }])
const selectedProduct = ref('')

async function loadData() {
  const res = await costApi.getMaterials({ product_id: selectedProduct.value })
  list.value = res.data.list || []
}

onMounted(async () => {
  await loadData()
})
</script>

<style scoped></style>
