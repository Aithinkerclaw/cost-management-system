<template>
  <div class="oee-calculator">
    <el-row :gutter="16">
      <!-- OEE录入表单 -->
      <el-col :xs="24" :lg="10">
        <el-card shadow="hover">
          <template #header><span>⚙️ OEE 数据录入</span></template>
          <el-form :model="form" label-width="110px" size="default">
            <el-form-item label="记录日期">
              <el-date-picker v-model="form.record_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
            </el-form-item>
            <el-form-item label="设备名称">
              <el-input v-model="form.equipment_name" placeholder="如：数控加工中心" />
            </el-form-item>
            <el-form-item label="班次">
              <el-radio-group v-model="form.shift"><el-radio-button value="早班">早班</el-radio-button><el-radio-button value="中班">中班</el-radio-button><el-radio-button value="夜班">夜班</el-radio-button></el-radio-group>
            </el-form-item>
            <el-form-item label="计划运行时间(分)">
              <el-input-number v-model="form.planned_time" :min="0" style="width:100%" />
            </el-form-item>
            <el-form-item label="停机时间(分)">
              <el-input-number v-model="form.downtime" :min="0" style="width:100%" />
            </el-form-item>
            <el-form-item label="理论周期(分/件)">
              <el-input-number v-model="form.cycle_time" :min="0.1" :step="0.1" style="width:100%" />
            </el-form-item>
            <el-form-item label="产量(件)">
              <el-input-number v-model="form.output_qty" :min="0" style="width:100%" />
            </el-form-item>
            <el-form-item label="不良品数(件)">
              <el-input-number v-model="form.defect_qty" :min="0" style="width:100%" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="submitOee" :loading="saving">💾 提交并计算OEE</el-button>
            </el-form-item>
          </el-form>

          <div v-if="lastResult" class="oee-result">
            <h4>📊 本次计算结果</h4>
            <div class="oee-grid">
              <div><label>可用率(A)</label><b>{{ lastResult.availability }}%</b></div>
              <div><label>性能率(P)</label><b>{{ lastResult.performance }}%</b></div>
              <div><label>合格率(Q)</label><b>{{ lastResult.quality_rate }}%</b></div>
              <div><label>OEE</label><b style="color:#1A73E8;font-size:20px">{{ lastResult.oee }}%</b></div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- OEE趋势图 -->
      <el-col :xs="24" :lg="14">
        <el-card shadow="hover">
          <template #header><span>📈 OEE 趋势（近14天）</span></template>
          <div ref="chartRef" style="height:400px"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { productionApi } from '../../api/index'

const form = reactive({ record_date: new Date().toISOString().slice(0, 10), equipment_id: '', equipment_name: '', shift: '早班', planned_time: 480, downtime: 30, cycle_time: 2, output_qty: 200, defect_qty: 5 })
const saving = ref(false)
const lastResult = ref(null)
const chartRef = ref(null)

async function submitOee() {
  saving.value = true
  try {
    const res = await productionApi.submitOee(form)
    lastResult.value = res.data
    ElMessage.success('OEE数据已提交！')
    loadChart()
  } finally { saving.value = false }
}

async function loadChart() {
  const res = await productionApi.getOee()
  const data = res.data || []
  await nextTick()
  if (chartRef.value) {
    const chart = echarts.init(chartRef.value)
    chart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['可用率A', '性能率P', '合格率Q', '综合OEE'], bottom: 0 },
      grid: { left: 50, right: 20, top: 20, bottom: 40 },
      xAxis: { type: 'category', data: data.map(d => d.record_date?.slice(5) || ''), axisLabel: { rotate: 45 } },
      yAxis: { type: 'value', name: '%', max: 100 },
      series: [
        { name: '可用率A', type: 'bar', stack: 'base', data: data.map(d => d.availability), itemStyle: { color: '#4CAF50' } },
        { name: '性能率P', type: 'bar', stack: 'base', data: data.map(d => d.performance), itemStyle: { color: '#FF9800' } },
        { name: '合格率Q', type: 'bar', stack: 'base', data: data.map(d => d.quality_rate), itemStyle: { color: '#1A73E8' } },
        { name: '综合OEE', type: 'line', data: data.map(d => d.oee), lineStyle: { width: 3, color: '#F44336' }, symbolSize: 6,
          markLine: {
            silent: true, lineStyle: { type: 'dashed', color: '#F44336' },
            data: [{ yAxis: 65, name: '警戒线65%', label: { formatter: '警戒线 65%' } }]
          }
        }
      ]
    })
  }
}

onMounted(loadChart)
</script>

<style scoped>
.oee-result { margin-top:20px; padding:16px; background:#f0f7ff; border-radius:8px; }
.oee-result h4 { margin-bottom:12px; }
.oee-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; text-align:center; }
.oee-grid div label { display:block; font-size:12px; color:#666; margin-bottom:2px; }
.oee-grid div b { font-size:18px; color:#333; }
</style>
