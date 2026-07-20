<template>
  <div class="spc-chart">
    <el-card shadow="hover">
      <template #header><span>📈 SPC 统计过程控制图（Xbar-R）</span></template>

      <el-form :inline="true" style="margin-bottom:16px">
        <el-form-item label="质量特性">
          <el-input v-model="characteristic" placeholder="如：关键尺寸A" style="width:200px" />
        </el-form-item>
        <el-form-item label="样本数据">
          <el-input v-model="inputValues" placeholder="逗号分隔，如：50.1,49.8,50.3..." style="width:400px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="runSpc">📊 生成控制图</el-button>
          <el-button @click="generateRandom">随机数据</el-button>
        </el-form-item>
        </el-form>

      <!-- 控制限信息 -->
      <div v-if="spcResult" class="control-limits">
        <el-row :gutter="16">
          <el-col :span="6"><div class="limit-card"><label>UCL (上控限)</label><b>{{ spcResult.limits.UCL }}</b></div></el-col>
          <el-col :span="6"><div class="limit-card"><label>CL (中心线)</label><b>{{ spcResult.limits.CL }}</b></div></el-col>
          <el-col :span="6"><div class="limit-card"><label>LCL (下控限)</label><b>{{ spcResult.limits.LCL }}</b></div></el-col>
          <el-col :span="6"><div class="limit-card"><label>均值标准差</label><b>σ={{ spcResult.stdDev }}</b></div></el-col>
        </el-row>
      </div>

      <!-- Xbar 控制图 -->
      <h4 v-if="spcResult">Xbar 控制图</h4>
      <div ref="chartRef" :style="{ height: spcResult ? '350px' : '0' }"></div>

      <!-- 判异结果 -->
      <div v-if="spcResult?.alerts?.length" class="alert-results">
        <el-alert type="warning" :title="'检测到 ' + spcResult.alerts.length + ' 个异常点'" show-icon :closable="false">
          <ol style="margin:0;padding-left:18px;font-size:13px;">
            <li v-for="(a, i) in spcResult.alerts" :key="i">{{ a }}</li>
          </ol>
        </el-alert>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { qualityApi } from '../../api/index'

const characteristic = ref('关键尺寸A')
const inputValues = ref('')
const spcResult = ref(null)
const chartRef = ref(null)

function generateRandom() {
  const arr = Array.from({ length: 25 }, () => +(50 + (Math.random() - 0.5) * 10).toFixed(2))
  // 故意插入几个异常点
  arr[5] += 4.2
  arr[15] -= 3.8
  inputValues.value = arr.join(', ')
}

async function runSpc() {
  let values
  if (inputValues.value) {
    values = inputValues.value.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v))
  } else {
    values = Array.from({ length: 25 }, () => +(50 + (Math.random() - 0.5) * 8).toFixed(2))
  }

  if (!values.length) return

  const res = await qualityApi.submitSpc({ characteristic: characteristic.value, values })
  spcResult.value = res.data

  await nextTick()
  if (chartRef.value && spcResult.value?.data) {
    const chart = echarts.init(chartRef.value)
    const d = spcResult.data
    const L = spcResult.limits

    chart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 60, right: 20, top: 30, bottom: 30 },
      xAxis: { type: 'category', data: d.map(p => p.index) },
      yAxis: { type: 'value', name: characteristic.value },
      series: [
        {
          type: 'line',
          data: d.map(p => p.value),
          symbolSize: d.map(p => p.isOutlier ? 12 : 5),
          itemStyle: d.map(p => p.isOutlier ? { color: '#F44336', borderColor: '#F44336' } : { color: '#1A73E8' }),
          lineStyle: { color: '#1A73E8', width: 1.5 },
          markLine: {
            silent: true,
            lineStyle: { type: 'dashed' },
            data: [
              { yAxis: L.UCL, name: 'UCL=' + L.UCL, lineStyle: { color: '#F44336' }, label: { formatter: 'UCL' } },
              { yAxis: L.CL, name: 'CL=' + L.CL, lineStyle: { color: '#4CAF50' } },
              { yAxis: L.LCL, name: 'LCL=' + L.LCL, lineStyle: { color: '#F44336' }, label: { formatter: 'LCL' } }
            ]
          }
        }
      ]
    })
  }
}

onMounted(() => generateRandom())
</script>

<style scoped>
.control-limits { margin:16px 0; }
.limit-card { text-align:center; background:#f0f7ff; padding:12px; border-radius:8px; }
.limit-card label { display:block; font-size:12px;color:#888; }
.limit-card b { font-size:20px; display:block; margin-top:2px; }
.alert-results { margin-top:16px; }
</style>
