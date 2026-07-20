<template>
  <div class="share-calculator">
    <el-row :gutter="16">
      <!-- 计算表单 -->
      <el-col :xs="24" :lg="10">
        <el-card shadow="hover">
          <template #header><span>💰 增量分享计算器</span></template>
          <p style="color:#666;font-size:13px;margin-bottom:16px">
            设定成本基线，系统自动计算节约额并按规则生成奖金。
          </p>
          <el-form :model="form" label-width="100px">
            <el-form-item label="成本基线(元)">
              <el-input-number v-model="form.baselineCost" :min="0" style="width:100%" />
            </el-form-item>
            <el-form-item label="实际成本(元)">
              <el-input-number v-model="form.actualCost" :min="0" style="width:100%" />
            </el-form-item>
            <el-form-item label="分享规则">
              <el-select v-model="form.ruleId" style="width:100%">
                <el-option v-for="r in rules" :key="r.id" :label="r.ruleName + '（' + (r.shareRatio*100) + '%）'" :value="r.id" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="calculate" size="large" style="width:100%">🧮 计算奖金</el-button>
            </el-form-item>
          </el-form>

          <div v-if="result" class="calc-result">
            <h4 style="margin-bottom:12px">📋 奖金分配明细</h4>
            <div class="result-row"><span class="result-label">💚 节约金额</span><b class="saving">{{ result.saving.toLocaleString() }} 元</b></div>
            <div class="result-row"><span class="result-label">🎯 总奖金额度</span><b class="total-bonus">{{ result.totalBonus.toLocaleString() }} 元</b></div>
            <div class="result-row"><span class="result-label">👥 团队奖金池</span><b>{{ result.teamBonus.toLocaleString() }} 元</b><small>({{ (rules.find(r=>r.id===form.ruleId)?.teamRatio*100 || 50) }}%)</small></div>
            <div class="result-row"><span class="result-label">👤 个人可分</span><b style="color:#FF9800;font-size:18px">{{ result.personalBonus.toLocaleString() }} 元</b></div>

            <el-progress :percentage="+((result.saving / form.baselineCost * 100)).toFixed(1)" :format="(val) => '成本改善 ' + val + '%'" style="margin-top:12px" />

            <h4 style="margin:16px 0 8px">💰 分配构成图</h4>
            <div ref="chartRef" style="height:200px"></div>
          </div>
        </el-card>
      </el-col>

      <!-- 规则说明 -->
      <el-col :xs="24" :lg="14">
        <el-card shadow="hover">
          <template #header><span>📜 分享规则一览</span></template>
          <el-table :data="rules" stripe size="small">
            <el-table-column prop="ruleName" label="规则名称" width="160" />
            <el-table-column prop="savingFrom" label="节约下限" align="right" width="90">
              <template #default="{ row }">¥{{ row.savingFrom?.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="savingTo" label="节约上限" align="right" width="90">
              <template #default="{ row }">{{ row.savingTo >= 9999999 ? '无上限' : '¥' + row.savingTo?.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="shareRatio" label="分享比例" width="90" align="center">
              <template #default="{ row }">{{ (row.shareRatio * 100) }}%</template>
            </el-table-column>
            <el-table-column prop="teamRatio" label="团队占比" width="90" align="center">
              <template #default="{ row }">{{ (row.teamRatio * 100) }}%</template>
            </el-table-column>
          </el-table>

          <el-alert type="info" :closable="false" show-icon style="margin-top:16px">
            <p style="font-size:13px;margin:0">💡 提示：节约额 = 成本基线 - 实际成本。只有实际成本低于基线时才产生分享奖励。团队奖金池由项目组成员按贡献度二次分配。</p>
          </el-alert>
        </el-card>

        <el-card shadow="hover" style="margin-top:16px">
          <template #header><span>🏆 近期成功案例</span></template>
          <el-timeline>
            <el-timeline-item timestamp="2026-06-01" placement="top" color="#4CAF50">
              <b>优化下料排版降低材料浪费</b><br/>
              节约 ¥72,000 | 团队奖金 ¥21,600 | 个人最高 ¥10,800
            </el-timeline-item>
            <el-timeline-item timestamp="2026-05-15" placement="top" color="#4CAF50">
              <b>焊接参数优化提升良率</b><br/>
              节约 ¥31,000 | 团队奖金 ¥7,750 | 个人最高 ¥3,875
            </el-timeline-item>
            <el-timeline-item timestamp="2026-05-01" placement="top" color="#FF9800">
              <b>集采钢材降低采购单价</b><br/>
              预计节约 ¥120,000 | 待实施
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { incentiveApi } from '../../api/index'

const rules = ref([])
const form = reactive({ baselineCost: 500000, actualCost: 420000, ruleId: 2 })
const result = ref(null)
const chartRef = ref(null)

onMounted(async () => {
  const res = await incentiveApi.getRules()
  rules.value = res.data
})

async function calculate() {
  if (form.baselineCost <= form.actualCost) return ElMessage.warning('实际成本必须低于基线才能产生奖励')
  const res = await incentiveApi.calculateBonus(form)
  result.value = res.data

  await nextTick()
  if (chartRef.value && result.value?.breakdown) {
    const chart = echarts.init(chartRef.value)
    const b = result.value.breakdown
    chart.setOption({
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie', radius: ['35%', '65%'],
        data: [
          { name: b[0].item, value: b[0].amount, itemStyle: { color: '#4CAF50' } },
          { name: b[1].item, value: b[1].amount, itemStyle: { color: '#1A73E8' } },
          { name: b[2].item, value: b[2].amount, itemStyle: { color: '#FF9800' } }
        ],
        label: { formatter: '{b}\n{c}元 ({d}%)' }
      }]
    })
  }
}
</script>

<style scoped>
.calc-result { margin-top:20px; padding:20px;background:#f8fff8;border:1px solid #c3e88d;border-radius:8px; }
.result-row { display:flex; justify-content:space-between; align-items:center; padding:10px 0;border-bottom:1px dashed #ddd; }
.result-label { font-size:14px; font-weight:500; }
.result-row b { font-size:16px; }
.result-row .saving { color:#4CAF50; font-size:22px !important; }
.result-row .total-bonus { color:#1A73E8; font-size:22px !important; }
</style>
