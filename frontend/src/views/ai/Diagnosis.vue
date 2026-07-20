<template>
  <div class="ai-diagnosis">
    <el-row :gutter="16">
      <!-- 左侧：诊断结果 -->
      <el-col :span="16">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>🤖 AI 成本诊断报告</span>
              <el-button type="primary" @click="runDiagnosis" :loading="diagnosing">
                {{ diagnosing ? '诊断中...' : '开始诊断' }}
              </el-button>
            </div>
          </template>

          <!-- 诊断评分 -->
          <div v-if="diagnosisResult" class="diagnosis-score">
            <div class="score-circle" :class="scoreClass">
              <span class="score-number">{{ diagnosisResult.overallScore }}</span>
              <span class="score-label">综合评分</span>
            </div>
            <div class="score-desc">
              <p v-if="diagnosisResult.overallScore >= 85" class="score-good">
                ✅ 成本管控良好，继续保持
              </p>
              <p v-else-if="diagnosisResult.overallScore >= 65" class="score-warning">
                ⚠️ 存在改进空间，建议优化
              </p>
              <p v-else class="score-danger">
                🔴 成本异常，建议立即处理
              </p>
              <p class="diag-time">诊断时间：{{ formatTime(diagnosisResult.diagnosedAt) }}</p>
            </div>
          </div>

          <!-- 诊断详情 -->
          <div v-if="diagnosisResult" class="diagnosis-details">
            <h4>问题诊断</h4>
            <div
              v-for="(item, index) in diagnosisResult.diagnoses"
              :key="index"
              class="diagnosis-item"
              :class="item.type"
            >
              <div class="diag-icon">
                <span v-if="item.type === 'danger'">🔴</span>
                <span v-else-if="item.type === 'warning'">🟡</span>
                <span v-else>🟢</span>
              </div>
              <div class="diag-content">
                <h5>{{ item.title }}</h5>
                <p>{{ item.desc }}</p>
                <p class="diag-action"><strong>建议行动：</strong>{{ item.action }}</p>
                <el-tag :type="item.impact === '高' ? 'danger' : item.impact === '中' ? 'warning' : 'success'" size="small">
                  影响：{{ item.impact }}
                </el-tag>
              </div>
            </div>
          </div>

          <!-- 改善建议 -->
          <div v-if="diagnosisResult && diagnosisResult.suggestions && diagnosisResult.suggestions.length > 0" class="improvement-suggestions">
            <h4>改善建议</h4>
            <el-timeline>
              <el-timeline-item
                v-for="(suggestion, index) in diagnosisResult.suggestions"
                :key="index"
                :timestamp="`建议${index + 1}`"
                placement="top"
              >
                {{ suggestion }}
              </el-timeline-item>
            </el-timeline>
          </div>

          <!-- 诊断历史 -->
          <div v-if="diagnosisHistory.length > 0" class="diagnosis-history">
            <h4>诊断历史</h4>
            <el-timeline>
              <el-timeline-item
                v-for="(item, index) in diagnosisHistory"
                :key="index"
                :timestamp="formatTime(item.diagnosed_at)"
                placement="top"
              >
                <div class="history-item">
                  <el-tag :type="item.overall_score >= 85 ? 'success' : item.overall_score >= 65 ? 'warning' : 'danger'" size="small">
                    评分：{{ item.overall_score }}
                  </el-tag>
                  <span class="history-diagnoses">{{ item.diagnoses?.length || 0 }} 个问题</span>
                </div>
              </el-timeline-item>
            </el-timeline>
          </div>

          <!-- 空状态 -->
          <el-empty v-if="!diagnosisResult && !diagnosing" description="点击「开始诊断」让AI分析您的成本数据" />
          <el-skeleton v-if="diagnosing && !diagnosisResult" :rows="10" animated />
        </el-card>
      </el-col>

      <!-- 右侧：数据快照 -->
      <el-col :span="8">
        <el-card shadow="never" v-if="diagnosisResult">
          <template #header>
            <span>📊 数据快照</span>
          </template>
          <div class="data-snapshot">
            <div class="snapshot-item">
              <span class="snapshot-label">平均单位成本</span>
              <span class="snapshot-value">¥{{ diagnosisResult.dataSnapshot.avgUnitCost?.toFixed(2) || '0.00' }}</span>
            </div>
            <div class="snapshot-item">
              <span class="snapshot-label">平均OEE</span>
              <span class="snapshot-value">{{ diagnosisResult.dataSnapshot.avgOee?.toFixed(1) || 'N/A' }}%</span>
            </div>
            <div class="snapshot-item">
              <span class="snapshot-label">库存总值</span>
              <span class="snapshot-value">¥{{ (diagnosisResult.dataSnapshot.totalInventoryValue || 0).toLocaleString() }}</span>
            </div>
            <div class="snapshot-item">
              <span class="snapshot-label">积压物料</span>
              <span class="snapshot-value danger">{{ diagnosisResult.dataSnapshot.overStockCount || 0 }} 种</span>
            </div>
            <div class="snapshot-item">
              <span class="snapshot-label">质量成本占比</span>
              <span class="snapshot-value">{{ diagnosisResult.dataSnapshot.qualityRatio || '0.0' }}%</span>
            </div>
          </div>
        </el-card>

        <!-- 模块建议 -->
        <el-card shadow="never" style="margin-top: 16px;">
          <template #header>
            <span>🎯 模块改善建议</span>
          </template>
          <el-form :inline="true">
            <el-form-item label="选择模块">
              <el-select v-model="selectedModule" placeholder="请选择模块">
                <el-option label="采购管理" value="procurement" />
                <el-option label="生产管理" value="production" />
                <el-option label="库存管理" value="inventory" />
                <el-option label="质量管理" value="quality" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="getModuleSuggestions" :loading="loadingSuggestions">
                获取建议
              </el-button>
            </el-form-item>
          </el-form>

          <div v-if="moduleSuggestions.length > 0" class="module-suggestions">
            <h5>{{ selectedModule }} 模块改善建议</h5>
            <ul>
              <li v-for="(suggestion, index) in moduleSuggestions" :key="index">
                {{ suggestion }}
              </li>
            </ul>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { aiApi } from '@/api'
import { ElMessage } from 'element-plus'

const diagnosisResult = ref(null)
const diagnosing = ref(false)
const selectedModule = ref('')
const moduleSuggestions = ref([])
const loadingSuggestions = ref(false)
const diagnosisHistory = ref([])  // 诊断历史
const loadingHistory = ref(false)

const scoreClass = ref('')

const runDiagnosis = async () => {
  diagnosing.value = true
  try {
    const res = await aiApi.diagnose()
    diagnosisResult.value = res.data
    updateScoreClass()
    ElMessage.success('诊断完成')
  } catch (error) {
    ElMessage.error('诊断失败：' + (error.message || '未知错误'))
  } finally {
    diagnosing.value = false
  }
}

const getModuleSuggestions = async () => {
  if (!selectedModule.value) {
    ElMessage.warning('请选择模块')
    return
  }
  loadingSuggestions.value = true
  try {
    const res = await aiApi.suggest(selectedModule.value, {})
    moduleSuggestions.value = res.data.suggestions
  } catch (error) {
    ElMessage.error('获取建议失败：' + (error.message || '未知错误'))
  } finally {
    loadingSuggestions.value = false
  }
}

const updateScoreClass = () => {
  if (!diagnosisResult.value) return
  const score = diagnosisResult.value.overallScore
  scoreClass.value = score >= 85 ? 'good' : score >= 65 ? 'warning' : 'danger'
}

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return date.toLocaleString('zh-CN')
}

const loadDiagnosisHistory = async () => {
  loadingHistory.value = true
  try {
    const res = await aiApi.getHistory()
    diagnosisHistory.value = res.data.list || []
  } catch (error) {
    console.error('加载诊断历史失败：', error)
  } finally {
    loadingHistory.value = false
  }
}

onMounted(() => {
  // 页面加载时自动诊断并加载历史
  runDiagnosis()
  loadDiagnosisHistory()
})
</script>

<style scoped>
.ai-diagnosis {
  padding: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.diagnosis-score {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.score-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-right: 24px;
  color: white;
  font-weight: bold;
}

.score-circle.good {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.score-circle.warning {
  background: linear-gradient(135deg, #e6a23c, #ebb563);
}

.score-circle.danger {
  background: linear-gradient(135deg, #f56c6c, #f89898);
}

.score-number {
  font-size: 32px;
  line-height: 1;
}

.score-label {
  font-size: 12px;
  margin-top: 4px;
}

.score-desc {
  flex: 1;
}

.score-good {
  color: #67c23a;
  font-size: 18px;
  font-weight: bold;
}

.score-warning {
  color: #e6a23c;
  font-size: 18px;
  font-weight: bold;
}

.score-danger {
  color: #f56c6c;
  font-size: 18px;
  font-weight: bold;
}

.diag-time {
  color: #909399;
  font-size: 12px;
  margin-top: 8px;
}

.diagnosis-details {
  margin-top: 24px;
}

.diagnosis-details h4 {
  margin-bottom: 16px;
  color: #303133;
}

.diagnosis-item {
  display: flex;
  padding: 16px;
  margin-bottom: 12px;
  border-radius: 8px;
  border-left: 4px solid;
}

.diagnosis-item.danger {
  background: #fef0f0;
  border-left-color: #f56c6c;
}

.diagnosis-item.warning {
  background: #fdf6ec;
  border-left-color: #e6a23c;
}

.diagnosis-item.good {
  background: #f0f9eb;
  border-left-color: #67c23a;
}

.diag-icon {
  font-size: 24px;
  margin-right: 16px;
}

.diag-content {
  flex: 1;
}

.diag-content h5 {
  margin: 0 0 8px 0;
  color: #303133;
}

.diag-content p {
  margin: 4px 0;
  color: #606266;
  font-size: 14px;
}

.diag-action {
  color: #909399;
  font-size: 13px;
}

.improvement-suggestions {
  margin-top: 24px;
}

.improvement-suggestions h4 {
  margin-bottom: 16px;
  color: #303133;
}

.data-snapshot {
  padding: 8px 0;
}

.snapshot-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
}

.snapshot-item:last-child {
  border-bottom: none;
}

.snapshot-label {
  color: #909399;
  font-size: 14px;
}

.snapshot-value {
  color: #303133;
  font-weight: bold;
  font-size: 16px;
}

.snapshot-value.danger {
  color: #f56c6c;
}

.module-suggestions {
  margin-top: 16px;
}

.module-suggestions h5 {
  margin-bottom: 12px;
  color: #303133;
}

.module-suggestions ul {
  padding-left: 20px;
}

.module-suggestions li {
  margin-bottom: 8px;
  color: #606266;
  line-height: 1.6;
}
</style>
