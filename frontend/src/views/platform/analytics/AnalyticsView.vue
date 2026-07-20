<template>
  <div class="analytics-page">
    <el-row :gutter="16" style="margin-bottom:16px">
      <el-col :span="24">
        <el-card header="近12月新增租户趋势">
          <div v-loading="loading" style="height:260px;display:flex;align-items:flex-end;gap:6px;padding:0 10px">
            <div
              v-for="(item,i) in revenueData" :key="i"
              class="rev-bar"
              :style="{ height: Math.max(item.newTenants * 30, 4) + 'px', flex:1 }"
              :title="`${item.month}: ${item.newTenants} 家`"
            >
              <div class="rev-bar-inner"></div>
              <div class="rev-bar-label">{{ item.month.slice(5) }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="12">
        <el-card header="行业分布">
          <div v-for="(item,i) in industries" :key="i" class="ind-item">
            <span>{{ item.name }}</span>
            <div class="ind-bar-wrap"><div class="ind-bar" :style="{ width:(item.value/maxInd*100)+'%' }"/></div>
            <span>{{ item.value }}</span>
          </div>
          <el-empty v-if="!industries.length" description="暂无数据" :image-size="60"/>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card header="模块使用热度">
          <div v-for="(item,i) in moduleUsage" :key="i" class="mod-item">
            <span>{{ item.name }}</span>
            <div class="mod-count"><strong>{{ item.count }}</strong> 条数据</div>
          </div>
          <el-empty v-if="!moduleUsage.length" description="暂无数据" :image-size="60"/>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import platformRequest from '../../../api/platformRequest'

const loading = ref(false)
const revenueData = ref([])
const industries = ref([])
const moduleUsage = ref([])

const maxInd = computed(() => Math.max(1, ...industries.value.map(i=>i.value)))

onMounted(async () => {
  loading.value=true
  try {
    const [r, i, m] = await Promise.all([
      platformRequest.get('/platform/analytics/revenue'),
      platformRequest.get('/platform/analytics/industries'),
      platformRequest.get('/platform/analytics/module-usage')
    ])
    revenueData.value=r.data; industries.value=i.data||[]; moduleUsage.value=m.data||[]
  } catch{} finally{ loading.value=false }
})
</script>

<style scoped>
.rev-bar { display:flex; flex-direction:column; align-items:center; justify-content:flex-end; min-width:16px;}
.rev-bar-inner { width:100%; background: linear-gradient(to top, #7c3aed, #c4b5fd); border-radius:3px 3px 0 0; flex:1; min-height:4px; transition:height .5s;}
.rev-bar-label { font-size:11px; color:#9ca3af; margin-top:4px; white-space:nowrap;}

.ind-item { display:flex; align-items:center; gap:8px; margin-bottom:8px; font-size:13px; }
.ind-item > span:first-child { width:80px; color:#374151; }
.ind-bar-wrap { flex:1; background:#ede9fe; border-radius:4px; overflow:hidden; height:18px; }
.ind-bar { height:100%; background:linear-gradient(90deg,#7c3aed,#a78bfa); border-radius:4px; transition:width .5s; }

.mod-item { display:flex; justify-content:space-between; padding:8px 12px; background:#f5f0ff; border-radius:6px; margin-bottom:6px; font-size:13px; color:#374151; }
.mod-count strong { color:#7c3aed; font-size:16px; }
</style>
