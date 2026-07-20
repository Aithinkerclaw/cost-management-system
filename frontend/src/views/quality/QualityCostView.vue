<template>
  <div class="quality-cost-view">
    <el-row :gutter="16">
      <!-- 总览卡片 -->
      <el-col :span="24">
        <el-card shadow="hover" style="margin-bottom:16px">
          <template #header><span>✅ 质量成本总览</span></template>
          <el-row :gutter="16">
            <el-col :span="6"><div class="qc-card" style="border-left:4px solid #1A73E8"><label>预防成本</label><b>{{ formatNum(overview?.prevention || 0) }}</b><span class="pct">占比{{ pct(overview?.prevention || 0) }}%</span></div></el-col>
            <el-col :span="6"><div class="qc-card" style="border-left:4px solid #4CAF50"><label>鉴定成本</label><b>{{ formatNum(overview?.appraisal || 0) }}</b><span class="pct">占比{{ pct(overview?.appraisal || 0) }}%</span></div></el-col>
            <el-col :span="6"><div class="qc-card" style="border-left:4px solid #FF9800"><label>内部失败</label><b style="color:#FF9800">{{ formatNum(overview?.internalFailure || 0) }}</b><span class="pct">占比{{ pct(overview?.internalFailure || 0) }}%</span></div></el-col>
            <el-col :span="6"><div class="qc-card" style="border-left:4px solid #F44336"><label>外部失败</label><b style="color:#F44336">{{ formatNum(overview?.externalFailure || 0) }}</b><span class="pct">占比{{ pct(overview?.externalFailure || 0) }}%</span></div></el-col>
          </el-row>

          <div style="text-align:center;margin-top:12px;font-size:20px;color:#333">
            质量成本总计：<b style="font-size:26px;color:#F44336">{{ formatNum(overview?.totalQualityCost || 0) }}</b> 元
          </div>
        </el-card>
      </el-col>

      <!-- PAF环形图 -->
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover">
          <template #header><span>📊 PAF 结构分布（vs 行业最优）</span></template>
          <div ref="ringRef" style="height:300px"></div>
        </el-card>
      </el-col>

      <!-- 行业对标 -->
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover">
          <template #header><span>🎯 行业对标分析</span></template>
          <div v-if="overview?.industryBenchmark" class="benchmark-list">
            <div v-for="(v, key) in overview.industryBenchmark" :key="key" class="bm-item">
              <span class="bm-label">{{ { prevention:'预防', appraisal:'鉴定', internalFailure:'内部失败', externalFailure:'外部失败' }[key] }}</span>
              <div class="bm-bars">
                <div class="bar actual" :style="{ width: (v.actual / maxVal * 100) + '%' }">实际 ¥{{ v.actual.toLocaleString() }}</div>
                <div class="bar benchmark" :style="{ width: (v.benchmark / maxVal * 100) + '%' }">行业 ¥{{ v.benchmark.toLocaleString() }}</div>
              </div>
              <el-tag size="small" :type="{ low:'success', ok:'warning', high:'danger' }[v.status]">{{ { low:'低于基准 ✓', ok:'接近', high:'高于基准 ⚠' }[v.status] }}</el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { qualityApi } from '../../api/index'

const overview = ref(null)
const ringRef = ref(null)
const maxVal = computed(() => {
  if (!overview.value?.industryBenchmark) return 100000
  const ib = overview.value.industryBenchmark
  return Math.max(ib.prevention.benchmark, ib.appraisal.benchmark, ib.internalFailure.benchmark, ib.externalFailure.benchmark)
})

function formatNum(n) { return Number(n).toLocaleString('zh-CN', { minimumFractionDigits: 0 }) }
function pct(v) { const t = overview.value?.totalQualityCost || 1; return (v * 100 / t).toFixed(1); }

onMounted(async () => {
  const res = await qualityApi.getOverview()
  overview.value = res.data

  await nextTick()
  if (ringRef.value && overview.value) {
    const chart = echarts.init(ringRef.value)
    const o = overview.value
    const colors = ['#1A73E8', '#4CAF50', '#FF9800', '#F44336']
    chart.setOption({
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie', radius: ['40%', '70%'], center: ['50%', '48%'],
        data: [
          { name: '预防', value: o.prevention || 0, itemStyle: { color: colors[0] } },
          { name: '鉴定', value: o.appraisal || 0, itemStyle: { color: colors[1] } },
          { name: '内部失败', value: o.internalFailure || 0, itemStyle: { color: colors[2] } },
          { name: '外部失败', value: o.externalFailure || 0, itemStyle: { color: colors[3] } }
        ],
        label: { formatter: '{b}\n{d}%' }
      }]
    })
  }
})
</script>

<style scoped>
.qc-card { padding:14px 18px; background:#f8f9fa; border-radius:8px; text-align:center; min-height:90px;display:flex; flex-direction:column; justify-content:center; gap:2px; }
.qc-card label { font-size:12px; color:#888; }
.qc-card b { font-size:22px; }
.qc-card .pct { font-size:11px; color:#aaa; }

.bm-item { margin-bottom: 14px; }
.bm-label { display:block; font-size:13px; font-weight:600;margin-bottom:4px; }
.bm-bars { margin-bottom:4px; }
.bar { height:20px; border-radius:4px; font-size:10px; line-height:20px; padding:0 6px; color:#fff; margin-bottom:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; }
.bar.actual { background: #1A73E8; opacity: 0.85; }
.bar.benchmark { background: #ddd; color: #666; }
</style>
