<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { NButton, NIcon, NTooltip } from 'naive-ui';
import { 
  SunnyOutline, 
  MoonOutline, 
  LanguageOutline, 
  RocketOutline,
  ConstructOutline,
  ArrowBackOutline
} from '@vicons/ionicons5';
import { useDark, useToggle } from '@vueuse/core';

const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();

const isDark = useDark();
const toggleDark = useToggle(isDark);

const isHome = computed(() => route.path === '/');

const toggleLanguage = () => {
  locale.value = locale.value === 'en' ? 'zh' : 'en';
};
</script>

<template>
  <nav class="sticky top-0 z-50 transition-colors duration-300"
       :class="isDark ? 'bg-slate-900 border-slate-800' : 'bg-white/80 backdrop-blur-md border-slate-100'">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between border-b"
         :class="isDark ? 'border-slate-800' : 'border-slate-100'">
      
      <!-- Left: Logo or Back Button -->
      <div class="flex items-center">
        <template v-if="!isHome">
          <n-button text @click="router.push('/')">
            <template #icon>
              <n-icon :size="20"><ArrowBackOutline /></n-icon>
            </template>
            <span class="ml-1 font-medium">{{ t('nav.back') }}</span>
          </n-button>
        </template>
        <template v-else>
          <div class="flex items-center gap-2 cursor-pointer" @click="router.push('/')">
             <div class="p-1.5 rounded-lg bg-blue-600 text-white">
               <n-icon :size="20"><ConstructOutline /></n-icon>
             </div>
             <span class="font-bold text-lg tracking-tight" :class="isDark ? 'text-white' : 'text-slate-800'">
               Engineering<span class="text-blue-600">.Tools</span>
             </span>
          </div>
        </template>
      </div>

      <!-- Right: Actions -->
      <div class="flex items-center gap-4">
        
        <!-- Theme Toggle -->
        <n-tooltip trigger="hover" placement="bottom">
          <template #trigger>
            <n-button text circle @click="toggleDark()">
              <template #icon>
                <n-icon :size="20" :color="isDark ? '#fbbf24' : '#64748b'">
                  <SunnyOutline v-if="isDark" />
                  <MoonOutline v-else />
                </n-icon>
              </template>
            </n-button>
          </template>
          <span>{{ isDark ? 'Light Mode' : 'Dark Mode' }}</span>
        </n-tooltip>

        <!-- Language Toggle -->
        <n-button text @click="toggleLanguage">
          <template #icon>
            <n-icon :size="20" class="text-slate-500"><LanguageOutline /></n-icon>
          </template>
          <span class="ml-1 font-bold text-slate-500">{{ locale === 'zh' ? 'EN' : '中' }}</span>
        </n-button>

        <!-- External Link -->
        <n-tooltip trigger="hover" placement="bottom">
          <template #trigger>
            <a href="https://semitia.top" target="_blank" rel="noopener noreferrer" 
               class="flex items-center text-slate-500 hover:text-blue-600 transition-colors">
              <n-icon :size="20"><RocketOutline /></n-icon>
            </a>
          </template>
          <span>Go to semitia.top</span>
        </n-tooltip>

      </div>
    </div>
  </nav>
</template>
