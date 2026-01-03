<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

// 判断是否在首页，如果不是首页，就显示返回按钮
const isHome = computed(() => route.path === '/');
</script>

<template>
  <div class="min-h-screen flex flex-col font-sans">
    
    <nav v-if="!isHome" class="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <button 
          @click="router.push('/')"
          class="flex items-center text-gray-500 hover:text-blue-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
          </svg>
          <span class="font-medium">返回工具箱</span>
        </button>
        <span class="text-sm text-gray-400 font-mono">Tools.xx.top</span>
      </div>
    </nav>

    <main class="flex-grow">
      <router-view />
    </main>

    <footer class="bg-white border-t border-gray-100 mt-auto py-6">
      <div class="text-center text-sm text-gray-400">
        &copy; {{ new Date().getFullYear() }} Engineering Tools Collection.
      </div>
    </footer>
  </div>
</template>