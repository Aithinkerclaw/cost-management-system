<template>
  <div class="platform-dashboard">
    <!-- KPI 卡片 -->
    <el-row :gutter="16" class="kpi-row">
      <el-col :span="6" v-for="(kpi, idx) in kpis" :key="idx">
        <el-card shadow="hover" class="kpi-card">
          <div class="kpi-value">{{ kpi.value }}</div>
          <div class="kpi-label">{{ kpi.label }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top:16px">
      <!-- 月度趋势 -->
      <el-col :span="14">
        <el-card header="近6月新增租户趋势">
          <div style="height:260px;display:flex;align-items:flex-end;gap:8px;padding:0 10px">
            <div
              v-for="(item, i) in monthlyTrend"
              :key="i"
              class="bar-item"
              :style="{ height: (item.count / maxMonthCount * 200) + 'px' }"
            >
              <div class="bar-tooltip">{{ item.count }} 家</div>
              <div class="bar-fill"></div>
              <div class="bar-label">{{ item.month.slice(5) }}</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 套餐分布 -->
      <el-col :span="10">
        <el-card header="套餐分布">
          <div v-for="(item, i) in planDistribution" :key="i" class="plan-dist-row">
            <span>{{ item.plan_name || '未知' }}</span>
            <div class="plan-bar-wrap">
              <div class="plan-bar" :style="{ width: (item.count / totalPlans * 100) + '%' }"></div>
            </div>
            <span class="plan-count">{{ item.count }} 家</span>
          </div>
          <el-empty v-if="!planDistribution.length" description="暂无数据" :image-size="80"/>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top:16px">
      <!-- Top 活跃租户 -->
      <el-col :span="24">
        <el-card header="Top 5 活跃租户">
          <el-table :data="topTenants" size="small" stripe>
            <el-table-column prop="short_name || company_name" label="企业名称" min-width="180">
              <template #default="{ row }">{{ row.short_name || row.company_name }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="row.status === 'active' ? 'success' : row.status === 'suspended' ? 'danger' : 'warning'" size="small">
                  {{ { active: '正常', suspended: '停用', expired: '过期', trial: '试用' }[row.status] || row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="user_count" label="用户数" width="80" align="right"/>
            <el-table-column prop="created_at" label="注册时间" width="170">
              <template #default="{ row }">{{ String(row.created_at || '').slice(0, 19).replace('T', ' ') }}</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 预估收入 -->
    <el-row :gutter="16" style="margin-top:16px">
      <el-col :span="12">
        <el-card header="预估月收入 (MRR)">
          <div class="revenue-display">¥{{ (revenue?.estimatedMonthly || 0).toLocaleString() }}/月</div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card header="系统信息">
          <div class="sys-info">
            <p>部署模式：<strong>SaaS 多租户</strong></p>
            <p>数据库：SQLite（共享库 + tenant_id 隔离）</p>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import platformRequest from '../../../api/platformRequest'

const kpis = ref([])
const planDistribution = ref([])
const monthlyTrend = ref([])
const topTenants = ref([])
const revenue = ref(null)

const totalPlans = computed(() => {
  return planDistribution.value.reduce((s, p) => s + (p.count || 0), 0) || 1
})
const maxMonthCount = computed(() => {
  return Math.max(1, ...monthlyTrend.value.map(m => m.count))
})

onMounted(async () => {
  try {
    const res = await platformRequest.get('/platform/dashboard')
    const d = res.data
    if (d.kpis) {
      kpis.value = [
        { value: d.kpis.totalTenants, label: '总租户数' },
        { value: d.kpis.activeTenants, label: '活跃租户' },
        { value: d.kpis.totalUsers, label: '总用户数' },
        { value: d.kpis.activeUsers30d, label: '本月活跃租户' }
      ]
    }
    planDistribution.value = d.planDistribution || []
    monthlyTrend.value = d.monthlyTrend || []
    topTenants.value = d.topTenants || []
    revenue.value = d.revenue
  } catch (e) {
    console.error('加载驾驶舱数据失败:', e)
  }
})
</script>

<style scoped>
.kpi-row .kpi-card { text-align: center; border-radius: 12px; border-left: 4px solid #7c3aed; }
.kpi-value { font-size: 28px; font-weight: 700; color: #4c1d95; line-height: 1.2; }
.kpi-label { font-size: 13px; color: #6b7280; margin-top: 4px; }

.bar-item { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; position: relative; min-width: 20px;}
.bar-fill { width: 28px; background: linear-gradient(to top, #7c3aed, #a78bfa); border-radius: 4px 4px 0 0; transition: height 0.5s; }
.bar-label { font-size: 11px; color: #9ca3af; margin-top: 6px; }
.bar-tooltip { font-size: 11px; color: #7c3aed; font-weight: 600; margin-bottom: 4px; opacity: 0; transition: opacity 0.2s; }
.bar-item:hover .bar-tooltip { opacity: 1; }

.plan-dist-row { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; font-size: 13px; }
.plan-dist-row > span:first-child { width: 90px; color: #374151; }
.plan-bar-wrap { flex: 1; background: #ede9fe; border-radius: 4px; overflow: hidden; height: 18px; }
.plan-bar { height: 100%; background: linear-gradient(90deg, #7c3aed, #a78bfa); border-radius: 4px; transition: width 0.5s; }
.plan-count { width: 40px; text-align: right; color: #7c3aed; font-weight: 600; }

.revenue-display { font-size: 36px; font-weight: 700; color: #059669; text-align: center; padding: 10px 0; }
.sys-info p { margin: 8px 0; font-size: 14px; color: #4b5563; }
</style>
