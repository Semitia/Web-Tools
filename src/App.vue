<script setup lang="ts">
import { computed } from 'vue';
import { NConfigProvider, darkTheme, type GlobalTheme } from 'naive-ui';
import { useDark } from '@vueuse/core';
import TheNavBar from './components/TheNavBar.vue';

const isDark = useDark();

const theme = computed<GlobalTheme | null>(() => (isDark.value ? darkTheme : null));
</script>

<template>
  <n-config-provider :theme="theme">
    <div class="min-h-screen flex flex-col font-sans transition-colors duration-300" 
         :class="isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'">
      
      <TheNavBar />

      <main class="flex-grow">
        <router-view />
      </main>

      <footer class="border-t py-6 transition-colors duration-300"
              :class="isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'">
        <div class="text-center text-sm" :class="isDark ? 'text-slate-500' : 'text-gray-400'">
          &copy; {{ new Date().getFullYear() }} Engineering Tools Collection.
        </div>
      </footer>
    </div>
  </n-config-provider>
</template>
