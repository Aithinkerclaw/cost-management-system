<template>
  <div class="audit-page">
    <el-card shadow="never" class="search-card">
      <el-form :inline="true" :model="search">
        <el-form-item label="操作类型"><el-input v-model="search.action" placeholder="如 tenant.create" clearable style="width:160px"/></el-form-item>
        <el-form-item label="操作人"><el-input v-model="search.operatorName" placeholder="" clearable style="width:120px"/></el-form-item>
        <el-form-item><el-button type="primary" @click="handleSearch">查询</el-button></el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" style="margin-top:12px">
      <el-table :data="logList" v-loading="loading" stripe size="small">
        <el-table-column prop="id" label="ID" width="60"/>
        <el-table-column prop="operator_name" label="操作人" width="100"/>
        <el-table-column prop="action" label="操作类型" width="150">
          <template #default="{ row }"><el-tag size="small">{{ row.action }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="target_type" label="目标类型" width="90"/>
        <el-table-column prop="target_id" label="目标ID" width="80"/>
        <el-table-column label="详情摘要" min-width="200">
          <template #default="{ row }"><code class="detail-code">{{ (row.detail || '').slice(0, 120) }}</code></template>
        </el-table-column>
        <el-table-column prop="ip" label="IP" width="130"/>
        <el-table-column prop="created_at" label="时间" width="170">
          <template #default="{ row }">{{ String(row.created_at||'').slice(0,19).replace('T',' ') }}</template>
        </el-table-column>
      </el-table>

      <div style="margin-top:16px;display:flex;justify-content:flex-end;">
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" layout="total, prev, pager, next" @current-change="fetchList"/>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import platformRequest from '../../../api/platformRequest'

const loading=ref(false), logList=ref([]), total=ref(0), page=ref(1), pageSize=ref(20)
const search = reactive({ action:'', operatorName:'' })

onMounted(fetchList)

function handleSearch() { page.value=1; fetchList() }

async function fetchList() {
  loading.value=true
  try {
    const res = await platformRequest.get('/platform/audit-log', { params: { page:page.value, pageSize:pageSize.value, ...search } })
    logList.value=res.data.list; total.value=res.data.total
  } catch{} finally{ loading.value=false }
}
</script>

<style scoped>.detail-code{font-size:11px;color:#4b5563;background:#f3f4f6;padding:2px 8px;border-radius:4px;display:inline-block;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}</style>
