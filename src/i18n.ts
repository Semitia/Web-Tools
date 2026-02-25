import { createI18n } from 'vue-i18n';

const messages = {
  en: {
    nav: {
      home: 'Home',
      back: 'Back',
      blog: 'Blog'
    },
    home: {
      title: 'Engineering Tools',
      subtitle: 'A collection of engineering calculation and visualization tools.',
      launch: 'Launch'
    },
    surgical: {
      base: {
        title: 'Base Dimensions (Base)',
        od: 'Outer Diameter (OD)',
        id: 'Inner Diameter (ID)',
        clearance: 'Clearance',
        gap: 'Min Gap (Gap)'
      },
      section1: {
        title: 'Section 1 (Section 1)'
      },
      section2: {
        title: 'Section 2 (Section 2)'
      },
      pcd: 'PCD',
      n: 'Count (N)',
      dia: 'Diameter (Dia)',
      real_hole: 'Actual Hole Dia',
      angle: 'Angle (°)',
      bellows: {
        title: 'Bellows Length',
        theta: 'Bend Angle θ (°)',
        epsilon: 'Strain ε (%)',
        length_label: 'Theoretical Length L:'
      },
      results: {
        min_wall: 'Min Wall Thickness',
        single_w1: 'Single Modulus (W1)',
        single_w2: 'Single Modulus (W2)',
        ratio: 'Stiffness Ratio (W2/W1)',
        total_w1: 'Total Modulus W1',
        total_w2: 'Total Modulus W2'
      },
      show_guides: 'Show Guides'
    }
  },
  zh: {
    nav: {
      home: '首页',
      back: '返回',
      blog: '博客'
    },
    home: {
      title: '工程工具箱',
      subtitle: '自建常用工程计算与可视化工具合集。',
      launch: '立即使用'
    },
    surgical: {
      base: {
        title: '基础尺寸 (Base)',
        od: '外圆直径 (OD)',
        id: '内圆直径 (ID)',
        clearance: '轴孔间隙 (Clearance)',
        gap: '最小间距 (Gap)'
      },
      section1: {
        title: '第一节孔 (Section 1)'
      },
      section2: {
        title: '第二节孔 (Section 2)'
      },
      pcd: '分度圆 (PCD)',
      n: '轴数量 (N)',
      dia: '轴直径 (Dia)',
      real_hole: '实际孔径',
      angle: '分布角度 (°)',
      bellows: {
        title: '波纹管长度 (Bellows Length)',
        theta: '弯曲角度 θ (°)',
        epsilon: '参考应变 ε (%)',
        length_label: '理论长度 L:'
      },
      results: {
        min_wall: '一二节最小壁厚',
        single_w1: '单轴模量 (Single W1)',
        single_w2: '单轴模量 (Single W2)',
        ratio: '刚度比 (W2/W1)',
        total_w1: '总模量 W1',
        total_w2: '总模量 W2'
      },
      show_guides: '显示辅助参考线 (Show Guides)'
    }
  }
};

const i18n = createI18n({
  legacy: false, // use Composition API
  locale: 'zh', // default locale
  fallbackLocale: 'en',
  messages
});

export default i18n;
