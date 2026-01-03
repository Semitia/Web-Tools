import { defineAsyncComponent } from 'vue';

export interface ToolItem {
  name: string;      // 工具名称
  path: string;      // 路由路径 (如 /surgical-preview)
  description: string; // 简短描述
  component: any;    // 对应的组件
}

export const tools: ToolItem[] = [
  {
    name: '手术工具截面预览',
    path: '/surgical-preview',
    description: '计算镍钛合金手术工具的截面参数、刚度比及实时绘图预览。',
    // 使用异步组件加载，优化首屏速度
    component: defineAsyncComponent(() => import('../tools/surgical-section/index.vue')) 
  },
  // 未来想加新工具，在这里复制一份即可
];