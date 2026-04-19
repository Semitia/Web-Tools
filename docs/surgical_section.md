# Surgical Section 理论计算说明

本文说明 `src/tools/surgical-section/index.vue` 中各项计算的理论来源、采用的简化假设，以及公式含义，便于后续校核和扩展。

## 1. 几何参数定义

- `OD`：截面外圆直径。
- `ID`：截面内圆直径。
- `clearance`：轴丝与孔之间的单边工艺补偿，这里直接加到轴径上形成“实际孔径”。
- `gap`：设计要求的一二节孔之间最小实体壁厚。
- `PCD`：对应一圈孔中心所在的分度圆直径。
- `d`：轴丝直径。
- `r = d / 2`：轴丝半径。
- `R = PCD / 2`：轴丝中心到截面几何中心的半径。

## 2. 实际孔径

代码中采用：

```text
holeD = d + clearance
```

这里的含义是把装配间隙直接等效到孔径中，用于后续绘图和最小壁厚校核。

对应实现：

```ts
const holeD1 = params.sec1.d + params.base.clearance;
const holeD2 = params.sec2.d + params.base.clearance;
```

## 3. 单根轴丝的截面惯性矩

当前工具里的 `calcW` 实际计算的是圆截面的二次面积矩：

```text
I = π d^4 / 64
```

代码实现：

```ts
const calcW = (d: number) => (Math.PI * Math.pow(d, 4)) / 64;
```

虽然变量名写成了 `W`，但从公式上看它更接近 `I` 而不是传统材料力学中常说的截面模量 `W = I / c`。  
目前工具把它作为“抗弯刚度贡献指标”使用，用来比较不同节段的相对刚度，这是合理的，只是术语上更准确的名称应为“截面惯性矩”或“刚度指标”。

## 4. 总刚度指标与刚度比

### 4.1 第一段总刚度指标

工具当前定义：

```text
totalW1 = n1 * I1 + n2 * I2
```

含义是：第一段工作时，默认第一段粗丝和第二段细丝都参与整体抗弯，因此把两部分贡献相加。

### 4.2 第二段总刚度指标

```text
totalW2 = n2 * I2
```

含义是：第二段单独弯曲时，只考虑第二段细丝的贡献。

### 4.3 刚度比

```text
ratio = totalW2 / totalW1
```

它反映第二段相对第一段的柔顺程度。  
数值越小，通常表示第二段相对更柔软，更容易优先弯曲。

## 5. 第一段粗丝的最小弯曲半径

这次新增的功能采用和第二段波纹管长度同源的简化模型。

### 5.1 基本假设

- 将截面中心线视为中性层附近的参考弯曲半径。
- 轴丝中心位于距截面中心 `R` 的位置。
- 轴丝最外侧纤维相对中心线再多出一个 `r` 的量。
- 采用小变形工程应变近似，并把轴丝外侧最大应变限制为 `ε`。

当前需求里，第一段粗丝约束为：

```text
ε_limit = 2% = 0.02
```

### 5.2 应变与弯曲半径关系

工具沿用了下面这套关系：

```text
ε = r / (ρ - R)
```

整理得到中心线弯曲半径：

```text
ρ = R + r / ε
```

因此第一段在粗丝最大应变不超过 2% 时的最小弯曲半径为：

```text
ρ_min,sec1 = R1 + r1 / 0.02
```

其中：

- `r1 = d1 / 2`
- `R1 = PCD1 / 2`

对应代码：

```ts
const sec1LimitEpsilon = 0.02;
const sec1r = params.sec1.d / 2;
const sec1R = params.sec1.pcd / 2;
const minBendRadiusSec1 = (sec1r / sec1LimitEpsilon) + sec1R;
```

### 5.3 代入当前默认值示例

默认参数下：

- `d1 = 0.48 mm`
- `PCD1 = 1.66 mm`
- `r1 = 0.24 mm`
- `R1 = 0.83 mm`

则：

```text
ρ_min,sec1 = 0.83 + 0.24 / 0.02 = 12.83 mm
```

这就是界面里新增显示的第一段最小弯曲半径。

## 6. 第二段细丝约束下的波纹管理论长度

### 6.1 已有计算逻辑

现有工具中，用户输入：

- 目标弯曲角度 `θ`
- 允许应变 `ε`

然后计算波纹管理论长度 `L`：

```text
L = θ * (R + r / ε)
```

其中：

- `θ` 需要用弧度参与计算
- `R = PCD2 / 2`
- `r = d2 / 2`

代码实现：

```ts
const thetaRad = (params.bellows.thetaDeg * Math.PI) / 180;
const epsilon = params.bellows.epsilonPercent / 100;
const r = params.sec2.d / 2;
const R = params.sec2.pcd / 2;
const L = thetaRad * ((r / epsilon) + R);
```

### 6.2 理论来源

由上一节的关系：

```text
ρ = R + r / ε
```

对于目标弯曲角度 `θ`，若沿中心线形成圆弧，则弧长满足：

```text
L = ρ * θ
```

所以：

```text
L = θ * (R + r / ε)
```

也就是说，这个公式本质上是：

1. 先由“允许应变”反推可接受的最小中心线弯曲半径；
2. 再根据“弯曲角度 × 弯曲半径 = 圆弧长度”得到所需波纹管长度。

## 7. 一二节孔之间的最小实体壁厚

当前绘图中会先生成第一节孔和第二节孔的圆心坐标，然后遍历所有跨节配对，找出圆心距最小的那一组：

```text
d_center,min = min(distance(P1, P2))
```

再减去两个孔半径，得到孔壁之间最薄的实体厚度：

```text
t_min = d_center,min - holeD1 / 2 - holeD2 / 2
```

代码对应：

```ts
const distMM = minDistPx / scale;
resultMetrics.minWallThickness = distMM - (results.value.holeD1 / 2) - (results.value.holeD2 / 2);
```

若：

```text
t_min < gap
```

界面会以红色提示，表示不满足最小壁厚要求。

## 8. 孔排布角度与节距关系

每个象限内孔群的角向节距并不是手工输入，而是由“孔径 + 最小间距”推回来的：

```text
chord = dia + gap
anglePerHole = 2 * asin(chord / PCD)
```

这来自圆弦长公式：

```text
chord = 2 * (PCD / 2) * sin(anglePerHole / 2)
      = PCD * sin(anglePerHole / 2)
```

因此：

```text
anglePerHole = 2 * asin(chord / PCD)
```

这里的作用主要是用于绘图排布与几何检查，确保同一节孔之间至少保留输入的 `gap`。

## 9. 适用范围与局限

当前模型适合做快速方案比较和参数预估，但仍有这些简化：

- 默认弯曲后各节沿同一圆弧近似，不考虑真实中性层漂移。
- 以应变控制反推弯曲半径，没有显式考虑材料弹塑性、疲劳寿命和安全系数。
- 总刚度指标只按单根圆轴 `πd^4/64` 线性叠加，没有带入真实边界条件、连接顺从性或三维接触影响。
- 最小壁厚检查是基于截面二维几何的静态最近距离，不包含制造误差累积和装配偏心。

因此，界面结果适合做设计前期估算；若要定版，建议再结合材料许用应变、有限元或试验数据进行复核。
