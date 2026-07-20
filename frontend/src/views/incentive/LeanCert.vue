<template>
  <div class="lean-cert">
    <el-row :gutter="16">
      <!-- 排行榜 -->
      <el-col :xs="24" :lg="14">
        <el-card shadow="hover">
          <template #header><span>🏆 积分排行榜</span></template>
          <div class="leaderboard" v-if="board.length > 0">
            <div v-for="(item, i) in board" :key="i" class="rank-item" :class="{ top3: i < 3, 'rank-1': i === 0, 'rank-2': i === 1, 'rank-3': i === 2 }">
              <div class="rank-num">{{ i + 1 }}</div>
              <div class="rank-avatar">{{ (item.realName || '?')[0] }}</div>
              <div class="rank-info">
                <b>{{ item.realName || '未知' }}</b>
                <span class="dept">{{ item.department }} · {{ item.proposalCount }}个提案</span>
              </div>
              <div class="rank-points"><b>{{ item.totalPoints }}</b><small>积分</small></div>
              <div v-if="i === 0" class="crown">👑</div>
              <el-tag size="small" :type="{ gold:'danger', silver:'warning', bronze:'info' }[item.level]">
                {{ { gold:'🥇 黄金', silver:'🥈 白银', bronze:'🥉 青铜' }[item.level] }}
              </el-tag>
            </div>
          </div>

          <!-- 认证等级说明 -->
          <div style="margin-top:24px;padding:16px;background:#f8f9fa;border-radius:8px;">
            <h4 style="margin-bottom:12px">🎖️ 精益认证等级体系</h4>
            <el-steps :active="2" align-center finish-status="success">
              <el-step title="黄带" description="≥100积分 | 基础精益知识" />
              <el-step title="绿带" description="≥500积分 | 独立带领项目" />
              <el-step title="黑带" description="≥2000积分 | 跨部门协调能力" />
            </el-steps>
          </div>
        </el-card>
      </el-col>

      <!-- 统计面板 -->
      <el-col :xs="24" :lg="10">
        <el-card shadow="hover" style="margin-bottom:16px">
          <template #header><span>📊 参与度统计</span></template>
          <div ref="chartRef1" style="height:220px"></div>
        </el-card>

        <el-card shadow="hover" style="margin-bottom:16px">
          <template #header><span>📈 积分分布</span></template>
          <div ref="chartRef2" style="height:220px"></div>
        </el-card>

        <el-card shadow="hover">
          <template #header><span>💡 激励机制</span></template>
          <el-timeline>
            <el-timeline-item timestamp="每日签到" placement="top" color="#4CAF50">+5 积分</el-timeline-item>
            <el-timeline-item timestamp="提交提案" placement="top" color="#FF9800">+预期节约额÷100</el-timeline-item>
            <el-timeline-item timestamp="提案通过" placement="top" color="#1A73E8">+基础积分×2</el-timeline-item>
            <el-timeline-item timestamp="提案完成" placement="top" color="#F44336">+实际节约额÷50</el-timeline-item>
            <el-timeline-item timestamp="积分兑换" placement="top" color="#9C27B0">100积分=¥10购物券</el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { incentiveApi } from '../../api/index'

const board = ref([])
const chartRef1 = ref(null)
const chartRef2 = ref(null)

onMounted(async () => {
  const res = await incentiveApi.getLeaderboard()
  board.value = res.data

  await nextTick()
  if (board.value.length && chartRef1.value) {
    const c1 = echarts.init(chartRef1.value)
    c1.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 60, right: 20, top: 10, bottom: 30 },
      xAxis: { type: 'category', data: board.value.map(b => b.realName) },
      yAxis: { type: 'value', name: '积分' },
      series: [{
        type: 'bar', data: board.value.map(b => b.totalPoints),
        itemStyle: (params) => ({
          color: params.dataIndex === 0 ? '#FFD700' :
                  params.dataIndex === 1 ? '#C0C0C0' :
                  params.dataIndex === 2 ? '#CD7F32' : '#1A73E8'
        }),
        barMaxWidth: 40
      }]
    })
  }

  if (board.value.length && chartRef2.value) {
    const c2 = echarts.init(chartRef2.value)
    c2.setOption({
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        radius: ['30%', '65%'],
        data: [
          { name: '黄金段(>500)', value: board.value.filter(b => b.totalPoints >= 500).length, itemStyle: { color: '#FFD700' } },
          { name: '白银段(100-500)', value: board.value.filter(b => b.totalPoints >= 100 && b.totalPoints < 500).length, itemStyle: { color: '#C0C0C0' } },
          { name: '青铜段(<100)', value: board.value.filter(b => b.totalPoints < 100).length, itemStyle: { color: '#CD7F32' } }
        ],
        label: { formatter: '{b}: {c}人 ({d}%)' }
      }]
    })
  }
})
</script>

<style scoped>
.leaderboard { display:flex; flex-direction: column; gap: 10px; }
.rank-item {
  display:flex; align-items:center; gap:12px; padding:12px 16px;
  background:#fff; border-radius:8px; border:1px solid #eee;
  transition: all 0.2s;
}
.rank-item:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.08); transform: translateX(4px); }
.rank-item.top3 { border-color: #ffd70044; background: linear-gradient(90deg, #fffef5, #fff, #fff); }
.rank-num {
  font-size:18px; font-weight:700; width:28px; text-align:center;
  color:#999; font-family:'Georgia',serif; flex-shrink:0;
}
.rank-1 .rank-num, .rank-2 .rank-num, .rank-3 .rank-num { color:#333; font-size:22px; }
.rank-1 .rank-num { color:#FFD700; -webkit-text-stroke:1px #B8860B; }
.rank-avatar {
  width:42px; height:42px; border-radius:50%; display:flex; align-items:center;
  justify-content:center; font-size:16px; font-weight:600; color:#fff;
  background:#ccc; flex-shrink:0;
}
.rank-item.top3 .rank-avatar { background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.rank-info { flex:1; min-width:0; }
.rank-info b { display:block; font-size:14px; }
.rank-info .dept { font-size:11px; color:#999; }
.rank-points { text-align:right; flex-shrink:0; }
.rank-points b { display:block; font-size:20px; color:#1A73E8; }
.rank-points small { font-size:10px; color:#aaa; }
.crown { position:absolute; right:20px; font-size:20px; animation:bounce 1s infinite; }
@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
</style>
