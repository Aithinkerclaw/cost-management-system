<template>
  <div class="smed-tracker">
    <el-card shadow="hover">
      <template #header><span>⏱️ SMED 快速换模跟踪</span></template>
      <p style="color:#666;font-size:13px;margin-bottom:16px">
        录入换模各步骤时间，系统自动识别内部/外部作业并推荐改进方向。
      </p>

      <el-form label-width="120px">
        <el-form-item label="设备">
          <el-input v-model="equipmentId" placeholder="设备编号" style="width:300px" />
        </el-form-item>
        <el-form-item label="换模步骤">
          <div v-for="(step, i) in steps" :key="i" class="smed-step-row">
            <el-input v-model="step.name" placeholder="步骤名称" style="width:200px" />
            <el-input-number v-model="step.time" :min="0" placeholder="时间(秒)" style="width:130px" />
            <el-select v-model="step.type" style="width:110px">
              <el-option label="内部作业" value="internal" />
              <el-option label="外部作业" value="external" />
            </el-select>
            <el-button type="danger" link @click="steps.splice(i,1)" :icon="Delete">删除</el-button>
          </div>
          <el-button size="small" type="primary" plain @click="steps.push({name:'', time:0, type:'external'})">+ 添加步骤</el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="analyzeSmed" :loading="loading">📊 分析换模时间</el-button>
        </el-form-item>
      </el-form>

      <!-- 分析结果 -->
      <div v-if="result" class="smed-result">
        <el-row :gutter="16">
          <el-col :span="6"><div class="res-card"><label>内部时间</label><b>{{ result.internalTime }}s</b></div></el-col>
          <el-col :span="6"><div class="res-card"><label>外部时间</label><b>{{ result.externalTime }}s</b></div></el-col>
          <el-col :span="6"><div class="res-card"><label>总时间</label><b>{{ result.totalTime }}s</b></div></el-col>
          <el-col :span="6"><div class="res-card"><label>内部占比</label><b style="color:result.internalPct>50 ? '#F44336' : '#4CAF50'">{{ result.internalPct }}%</b></div></el-col>
        </el-row>

        <h4 style="margin:16px 0 8px">💡 改进建议</h4>
        <ul v-for="(sug, i) in result.improvementSuggestions || []" :key="i" class="suggestion-item">
          {{ sug }}
        </ul>

        <div ref="chartRef" style="height:250px;margin-top:16px"></div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { Delete } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { productionApi } from '../../api/index'

const equipmentId = ref('CNC-01')
const loading = ref(false)
const steps = reactive([
  { name: '准备新模具', time: 45, type: 'external' },
  { name: '停机拆卸旧模', time: 25, type: 'internal' },
  { name: '清洁工装面', time: 15, type: 'internal' },
  { name: '安装新模具', time: 35, type: 'internal' },
  { name: '首件试加工', time: 20, type: 'internal' },
  { name: '清理旧模具', time: 30, type: 'external' }
])
const result = ref(null)
const chartRef = ref(null)

async function analyzeSmed() {
  loading.value = true
  try {
    const res = await productionApi.submitSmed({ equipmentId: equipmentId.value, steps })
    result.value = res.data

    // 饼图
    await nextTick()
    if (chartRef.value) {
      const chart = echarts.init(chartRef.value)
      chart.setOption({
        tooltip: { trigger: 'item', formatter: '{b}: {c}s ({d}%)' },
        series: [{
          type: 'pie', radius: ['35%', '65%'],
          data: [
            { name: '内部作业', value: result.value.internalTime, itemStyle: { color: '#F44336' } },
            { name: '外部作业', value: result.value.externalTime, itemStyle: { color: '#4CAF50' } }
          ],
          label: { formatter: '{b}\n{c}s ({d}%)' }
        }]
      })
    }
  } finally { loading.value = false }
}
</script>

<style scoped>
.smed-step-row { display: flex; gap: 8px; margin-bottom: 8px; align-items: center; }
.smed-result { margin-top:20px; padding-top:20px; border-top:1px solid #eee; }
.res-card { text-align:center; background:#f8f9fa; padding:14px; border-radius:8px; }
.res-card label { display:block; font-size:12px; color:#888; }
.res-card b { font-size:22px; display:block; margin-top:4px; }
.suggestion-item { font-size:13px; color:#555; padding: 6px 0 6px 20px; list-style-type: disc; }
</style>
