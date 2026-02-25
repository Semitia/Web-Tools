<script setup lang="ts">
import { tools } from '../config/tools';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

const router = useRouter();
const { t } = useI18n();
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-12">
    <header class="text-center mb-16">
      <h1 class="text-4xl font-extrabold text-slate-800 dark:text-white mb-4 tracking-tight">
        {{ t('home.title') }} <span class="text-blue-600">.Tools</span>
      </h1>
      <p class="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">
        {{ t('home.subtitle') }}
      </p>
    </header>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <div 
        v-for="tool in tools" 
        :key="tool.path"
        @click="router.push(tool.path)"
        class="group bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm hover:shadow-xl border border-slate-100 dark:border-slate-700 transition-all duration-300 cursor-pointer flex flex-col"
      >
        <div class="mb-4">
          <span class="inline-block p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
          </span>
        </div>
        <h2 class="text-xl font-bold text-slate-800 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {{ tool.name }}
        </h2>
        <p class="text-slate-500 dark:text-slate-400 text-sm leading-relaxed flex-grow">
          {{ tool.description }}
        </p>
        <div class="mt-6 flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
          {{ t('home.launch') }} &rarr;
        </div>
      </div>
    </div>
  </div>
</template>
