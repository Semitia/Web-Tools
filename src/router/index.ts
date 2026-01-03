import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import { tools } from '../config/tools';

// 1. 定义基础路由
const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  }
];

// 2. 动态添加所有工具的路由
// 这样你只需改 config/tools.ts，路由会自动注册
tools.forEach(tool => {
  routes.push({
    path: tool.path,
    name: tool.name,
    component: tool.component
  });
});

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;