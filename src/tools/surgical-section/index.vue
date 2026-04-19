<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDark } from '@vueuse/core';

const { t } = useI18n();
const isDark = useDark();

// --- 1. 定义响应式状态 (State) ---
const params = reactive({
  base: {
    od: 2.80,      // 外圆直径
    id: 1.00,      // 内圆直径
    clearance: 0.02, // 轴孔间隙
    gap: 0.11      // 最小壁厚
  },
  sec1: {
    pcd: 1.66,
    n: 4,
    d: 0.48,
    angle: 0
  },
  sec2: {
    pcd: 1.85,
    n: 8,
    d: 0.30,
    angle: 45
  },
  bellows: {
    thetaDeg: 60,       // 默认 60度 (即 pi/3)
    epsilonPercent: 2.0 // 默认 2.0%
  },
  settings: {
    showGuides: true
  }
});

// Canvas 引用
const canvasRef = ref<HTMLCanvasElement | null>(null);

// 辅助状态：用于存储计算出来的最小壁厚，方便显示红色警告
const resultMetrics = reactive({
  minWallThickness: 0,
});

// --- 2. 计算属性 (Computed Logic) ---
const results = computed(() => {
  const holeD1 = params.sec1.d + params.base.clearance;
  const holeD2 = params.sec2.d + params.base.clearance;

  // 惯性矩/模量计算公式 (圆形截面)
  const calcW = (d: number) => (Math.PI * Math.pow(d, 4)) / 64;
  
  const w1 = calcW(params.sec1.d);
  const w2 = calcW(params.sec2.d);
  
  const totalW1 = params.sec1.n * w1 + params.sec2.n * w2; 
  const totalW2 = params.sec2.n * w2;

  const ratio = totalW1 > 0 ? totalW2 / totalW1 : 0;

  // 应变-曲率关系采用 epsilon = r / (rho - R)
  // 其中 rho 为弯曲中心线半径，R 为丝中心到截面中心的半径
  const sec1LimitEpsilon = 0.02;
  const sec1r = params.sec1.d / 2;
  const sec1R = params.sec1.pcd / 2;
  const minBendRadiusSec1 = sec1LimitEpsilon > 0 ? (sec1r / sec1LimitEpsilon) + sec1R : 0;

  // 波纹管长度计算 L = theta * rho，且 rho = r/epsilon + R
  const thetaRad = (params.bellows.thetaDeg * Math.PI) / 180; // 角度转弧度
  const epsilon = params.bellows.epsilonPercent / 100;        // 百分比转小数
  const r = params.sec2.d / 2;                                // 细丝半径 (r)
  const R = params.sec2.pcd / 2;                              // 分度圆半径 (R)

  let L = 0;
  if (epsilon > 0) {
    L = thetaRad * ((r / epsilon) + R);
  }

  return {
    holeD1,
    holeD2,
    singleW1: w1,
    singleW2: w2,
    totalW1,
    totalW2,
    ratio,
    minBendRadiusSec1,
    sec1LimitEpsilonPercent: sec1LimitEpsilon * 100,
    bellowsLength: L,
  };
});

// --- 3. 核心绘图逻辑 ---
const draw = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 初始化画布
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2;
  
  // 自动缩放计算: 留白 30px
  const maxRadius = params.base.od / 2;
  const scale = (width / 2 - 30) / maxRadius;

  // Theme colors
  const mainStroke = isDark.value ? '#e2e8f0' : '#333'; // slate-200 : gray-800
  const guideStroke = isDark.value ? '#94a3b8' : '#666'; // slate-400 : gray-500
  const axisStroke = isDark.value ? '#cbd5e1' : '#000'; // slate-300 : black
  const holeFill = '#7a81b5';
  const holeStroke = isDark.value ? '#e2e8f0' : '#000';

  // --- 内部绘图工具函数 ---
  const drawCircle = (r: number, color: string | null, stroke = true, dashed = false) => {
    if (r <= 0) return;
    ctx.beginPath();
    if (dashed) ctx.setLineDash([5, 3]); else ctx.setLineDash([]);
    ctx.arc(cx, cy, r * scale, 0, 2 * Math.PI);
    if (color) { ctx.fillStyle = color; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = mainStroke; ctx.lineWidth = 1.2; ctx.stroke(); }
    ctx.setLineDash([]);
  };

  const drawClusteredHoles = (pcd: number, totalHoles: number, dia: number, baseAnchorDeg: number) => {
    const coords: {x: number, y: number}[] = [];
    if (totalHoles <= 0 || pcd <= 0) return coords;

    const r = (pcd / 2) * scale;
    const holeR = (dia / 2) * scale;
    const gap = params.base.gap; 

    // 计算角度
    const chord = dia + gap;
    if (chord > pcd) return coords; 
    const anglePerHole = 2 * Math.asin(chord / pcd);
    
    const holesPerQuadrant = Math.floor(totalHoles / 4);
    if (holesPerQuadrant === 0) return coords;

    const clusterWidth = (holesPerQuadrant - 1) * anglePerHole;

    // 遍历4个象限
    for (let q = 0; q < 4; q++) {
      const quadrantCenterRad = (baseAnchorDeg + q * 90) * (Math.PI / 180);
      const startRad = quadrantCenterRad - (clusterWidth / 2);

      for (let i = 0; i < holesPerQuadrant; i++) {
        const theta = startRad + i * anglePerHole;
        const x = cx + r * Math.cos(theta);
        const y = cy + r * Math.sin(theta);
        coords.push({x, y});

        // 绘制孔
        ctx.beginPath();
        ctx.arc(x, y, holeR, 0, 2 * Math.PI);
        ctx.fillStyle = holeFill;
        ctx.fill();
        ctx.strokeStyle = holeStroke;
        ctx.lineWidth = 1;
        ctx.stroke();

        // 绘制十字标记
        if (params.settings.showGuides) {
          ctx.beginPath();
          const len = holeR + 4;
          // 径向
          ctx.moveTo(x - len * Math.cos(theta), y - len * Math.sin(theta));
          ctx.lineTo(x + len * Math.cos(theta), y + len * Math.sin(theta));
          // 切向
          ctx.moveTo(x - len * Math.cos(theta + Math.PI/2), y - len * Math.sin(theta + Math.PI/2));
          ctx.lineTo(x + len * Math.cos(theta + Math.PI/2), y + len * Math.sin(theta + Math.PI/2));
          ctx.strokeStyle = mainStroke;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    // 绘制PCD虚线
    if (params.settings.showGuides) {
      drawCircle(pcd / 2, null, true, true);
    }
    return coords;
  };

  // --- 开始绘制 ---
  // 1. 外圆
  drawCircle(params.base.od / 2, '#9da3c9', true);

  // 2. 第一节孔
  const points1 = drawClusteredHoles(params.sec1.pcd, params.sec1.n, results.value.holeD1, params.sec1.angle);

  // 3. 第二节孔
  const points2 = drawClusteredHoles(params.sec2.pcd, params.sec2.n, results.value.holeD2, params.sec2.angle);

  // 4. 内圆
  drawCircle(params.base.id / 2, '#6a71a5', true);

  // 5. 辅助线
  if (params.settings.showGuides) {
    ctx.strokeStyle = axisStroke;
    ctx.lineWidth = 0.5;
    ctx.setLineDash([20, 5, 5, 5]);
    ctx.beginPath(); ctx.moveTo(cx - maxRadius * scale - 10, cy); ctx.lineTo(cx + maxRadius * scale + 10, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - maxRadius * scale - 10); ctx.lineTo(cx, cy + maxRadius * scale + 10); ctx.stroke();
    
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = guideStroke;
    const diagLen = (maxRadius * scale) + 5;
    const offset = diagLen * Math.sin(Math.PI/4);
    ctx.beginPath(); ctx.moveTo(cx - offset, cy - offset); ctx.lineTo(cx + offset, cy + offset); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - offset, cy + offset); ctx.lineTo(cx + offset, cy - offset); ctx.stroke();
    ctx.setLineDash([]);
  }

  // --- 计算最小实体壁厚 ---
  if (points1.length > 0 && points2.length > 0) {
    let minDistPx = Infinity;
    for (const p1 of points1) {
      for (const p2 of points2) {
        const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        if (dist < minDistPx) minDistPx = dist;
      }
    }
    const distMM = minDistPx / scale;
    resultMetrics.minWallThickness = distMM - (results.value.holeD1 / 2) - (results.value.holeD2 / 2);
  } else {
    resultMetrics.minWallThickness = 0;
  }
};

// --- 4. 监听与挂载 ---
watch(params, () => {
  draw();
}, { deep: true });

watch(isDark, () => {
  // Give a small delay for transitions or just draw
  requestAnimationFrame(draw);
});

onMounted(() => {
  draw();
});
</script>

<template>
  <div class="flex flex-col lg:flex-row gap-6 p-4 max-w-7xl mx-auto mt-6">
    
    <div class="flex-1 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 min-w-[320px] transition-colors duration-300">
      
      <div class="mb-6">
        <h3 class="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-4 border-b dark:border-slate-700 pb-2">
          {{ t('surgical.base.title') }}
        </h3>
        <div class="space-y-3">
          <div class="control-row">
            <label>{{ t('surgical.base.od') }}</label>
            <input type="number" v-model.number="params.base.od" step="0.01">
          </div>
          <div class="control-row">
            <label>{{ t('surgical.base.id') }}</label>
            <input type="number" v-model.number="params.base.id" step="0.01">
          </div>
          <div class="control-row">
            <label>{{ t('surgical.base.clearance') }}</label>
            <input type="number" v-model.number="params.base.clearance" step="0.01" class="!bg-blue-50 dark:!bg-blue-900/30 !border-blue-200 dark:!border-blue-800">
          </div>
          <div class="control-row">
            <label>{{ t('surgical.base.gap') }}</label>
            <input type="number" v-model.number="params.base.gap" step="0.01" class="!bg-yellow-50 dark:!bg-yellow-900/30 !border-yellow-200 dark:!border-yellow-800">
          </div>
        </div>
      </div>

      <div class="mb-6">
        <h3 class="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-4 border-b dark:border-slate-700 pb-2">
          {{ t('surgical.section1.title') }}
        </h3>
        <div class="space-y-3">
          <div class="control-row">
            <label>{{ t('surgical.pcd') }}</label>
            <input type="number" v-model.number="params.sec1.pcd" step="0.01">
          </div>
          <div class="control-row">
            <label>{{ t('surgical.n') }}</label>
            <input type="number" v-model.number="params.sec1.n" step="4">
          </div>
          <div class="control-row">
            <label>{{ t('surgical.dia') }}</label>
            <input type="number" v-model.number="params.sec1.d" step="0.01">
          </div>
          <div class="control-row">
            <label>{{ t('surgical.real_hole') }}</label>
            <span class="text-blue-600 dark:text-blue-400 font-mono">{{ results.holeD1.toFixed(2) }}</span>
          </div>
          <div class="control-row">
            <label>{{ t('surgical.angle') }}</label>
            <input type="number" v-model.number="params.sec1.angle">
          </div>
          <div class="control-row">
            <label :title="t('surgical.section1.min_radius_tip', { epsilon: results.sec1LimitEpsilonPercent.toFixed(1) })">
              {{ t('surgical.section1.min_radius_label') }}
            </label>
            <span class="text-xl font-bold text-indigo-600 dark:text-indigo-400 font-mono">
              {{ results.minBendRadiusSec1.toFixed(3) }} <span class="text-sm text-gray-500 font-normal">mm</span>
            </span>
          </div>
        </div>
      </div>

      <div class="mb-6">
        <h3 class="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-4 border-b dark:border-slate-700 pb-2">
          {{ t('surgical.section2.title') }}
        </h3>
        <div class="space-y-3">
          <div class="control-row">
            <label>{{ t('surgical.pcd') }}</label>
            <input type="number" v-model.number="params.sec2.pcd" step="0.01">
          </div>
          <div class="control-row">
            <label>{{ t('surgical.n') }}</label>
            <input type="number" v-model.number="params.sec2.n" step="4">
          </div>
          <div class="control-row">
            <label>{{ t('surgical.dia') }}</label>
            <input type="number" v-model.number="params.sec2.d" step="0.01">
          </div>
          <div class="control-row">
            <label>{{ t('surgical.real_hole') }}</label>
            <span class="text-blue-600 dark:text-blue-400 font-mono">{{ results.holeD2.toFixed(2) }}</span>
          </div>
          <div class="control-row">
            <label>{{ t('surgical.angle') }}</label>
            <input type="number" v-model.number="params.sec2.angle">
          </div>
        </div>
      </div>

      <div> 
        <h3 class="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-4 border-b dark:border-slate-700 pb-2">
          {{ t('surgical.bellows.title') }}
        </h3>
        
        <div class="space-y-3">
          <div class="control-row">
            <label :title="t('surgical.bellows.theta')">{{ t('surgical.bellows.theta') }}</label>
            <input type="number" v-model.number="params.bellows.thetaDeg">
          </div>
          <div class="control-row">
            <label :title="t('surgical.bellows.epsilon')">{{ t('surgical.bellows.epsilon') }}</label>
            <input type="number" v-model.number="params.bellows.epsilonPercent" step="0.001">
          </div>
          
          <div class="mt-4 border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <span class="text-sm text-gray-600 dark:text-gray-400 font-medium">{{ t('surgical.bellows.length_label') }}</span>
            <span class="text-xl font-bold text-indigo-600 dark:text-indigo-400 font-mono">
              {{ results.bellowsLength.toFixed(3) }} <span class="text-sm text-gray-500 font-normal">mm</span>
            </span>
          </div>
        </div>
      </div>

    </div>

    <div class="flex-[1.5] flex flex-col gap-4">
      
      <div class="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-5 grid grid-cols-2 lg:grid-cols-3 gap-6 transition-colors duration-300">
        <div class="res-item">
          <span class="label">{{ t('surgical.results.min_wall') }}</span>
          <span class="val text-lg" :class="resultMetrics.minWallThickness < params.base.gap ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'">
            {{ resultMetrics.minWallThickness.toFixed(3) }} mm
          </span>
        </div>

        <div class="res-item">
          <span class="label">{{ t('surgical.results.min_bend_radius_sec1') }}</span>
          <span class="val text-xl text-indigo-600 dark:text-indigo-400">
            {{ results.minBendRadiusSec1.toFixed(3) }} <span class="text-sm text-gray-500 font-normal">mm</span>
          </span>
        </div>

        <div class="res-item">
          <span class="label">{{ t('surgical.results.single_w1') }}</span>
          <span class="val text-gray-700 dark:text-slate-300">{{ results.singleW1.toFixed(5) }}</span>
        </div>

        <div class="res-item">
          <span class="label">{{ t('surgical.results.single_w2') }}</span>
          <span class="val text-gray-700 dark:text-slate-300">{{ results.singleW2.toFixed(5) }}</span>
        </div>

        <div class="res-item">
          <span class="label">{{ t('surgical.results.ratio') }}</span>
          <span class="val text-lg text-emerald-600 dark:text-emerald-400 font-bold">{{ results.ratio.toFixed(3) }}</span>
        </div>
        <div class="res-item">
          <span class="label">{{ t('surgical.results.total_w1') }}</span>
          <span class="val text-blue-600 dark:text-blue-400">{{ results.totalW1.toFixed(5) }}</span>
        </div>
        <div class="res-item">
          <span class="label">{{ t('surgical.results.total_w2') }}</span>
          <span class="val text-blue-600 dark:text-blue-400">{{ results.totalW2.toFixed(5) }}</span>
        </div>
      </div>

      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 flex flex-col items-center transition-colors duration-300">
        <canvas ref="canvasRef" width="560" height="560" class="w-full h-auto max-w-[560px]"></canvas>
        
        <div class="mt-6 flex items-center gap-2 bg-gray-100 dark:bg-slate-700 px-4 py-2 rounded-full transition-colors">
          <input type="checkbox" id="guides" v-model="params.settings.showGuides" class="w-4 h-4 text-blue-600 rounded cursor-pointer">
          <label for="guides" class="text-sm text-gray-600 dark:text-gray-300 select-none cursor-pointer">{{ t('surgical.show_guides') }}</label>
        </div>
      </div>

    </div>

  </div>
</template>

<style scoped>
/* 简单的工具类，配合 Tailwind */
.control-row {
  @apply flex justify-between items-center;
}
.control-row label {
  @apply text-sm text-gray-600 dark:text-gray-400;
}
.control-row input {
  @apply w-24 px-3 py-1 text-right border border-gray-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-mono text-sm bg-white dark:bg-slate-700 dark:text-white;
}
.res-item {
  @apply flex flex-col;
}
.res-item .label {
  @apply text-xs text-gray-500 dark:text-slate-500 mb-1 uppercase tracking-wider;
}
.res-item .val {
  @apply font-mono font-bold;
}
</style>
