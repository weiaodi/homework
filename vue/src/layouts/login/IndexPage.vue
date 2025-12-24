<template>
  <main class="w-full h-screen px-0 overflow-hidden flex bg-gray-50">
    <!-- 左半部分 - 背景图区域 -->
    <aside
      class="w-5/12 h-full flex flex-col justify-center items-center relative overflow-hidden"
      style="background: linear-gradient(135deg, #a162f7 0%, #7c3aed 100%)"
    >
      <!-- 装饰性背景（可选，增加层次感） -->
      <div class="absolute inset-0 opacity-10">
        <div
          class="absolute top-0 left-0 w-full h-full bg-[url('https://picsum.photos/id/1071/1000/1000')] bg-cover bg-center"
        ></div>
      </div>
      <el-image
        :src="'http://www.djtu.edu.cn/Upload/image/20230322/bdb6ba07-aaee-4c66-9c9a-faa8bad7ba53.png'"
        fit="contain"
        class="w-5/6 h-auto transition-all duration-500 hover:scale-105"
      ></el-image>
      <!-- 左侧文字说明 -->
      <div class="absolute bottom-10 text-white text-center px-8">
        <h2 class="text-2xl font-bold mb-2">大连交通大学 · 本科毕业设计</h2>
        <p class="text-sm opacity-80">迪迪汽车销售系统 · 高效管理 · 便捷服务</p>
      </div>
    </aside>

    <!-- 右半部分 - 登录表单区域（无修改） -->
    <article
      class="w-7/12 h-full flex flex-col gap-12 justify-center items-center px-16"
    >
      <!-- 头部 -->
      <header class="flex flex-col gap-6 items-center w-full max-w-md">
        <section class="flex gap-3 items-center">
          <!-- LOGO -->
          <img
            src="@/assets/icon/logo.png"
            alt="LOGO"
            class="w-16 h-16 rounded-full shadow-lg"
          />
          <!-- 系统名称 -->
          <h1 class="font-bold text-4xl text-gray-800 tracking-wider">
            迪迪汽车销售系统
          </h1>
        </section>
        <!-- 系统描述 -->
        <span class="font-medium text-xl text-gray-500">
          {{ introduce }}
        </span>
        <!-- 分割线 -->
        <div class="w-full h-px bg-gray-200"></div>
      </header>

      <!-- 登录表单（增加卡片样式） -->
      <div
        class="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 transition-all duration-300 hover:shadow-2xl"
      >
        <LoginForm />
      </div>

      <!-- 底部版权信息 -->
      <footer class="text-gray-400 text-sm mt-8">
        © 2025 迪迪汽车销售系统 版权所有
      </footer>
    </article>
  </main>
</template>

<script>
import LoginForm from './LoginForm';
export default {
  name: 'LoginPage',
  components: { LoginForm },
  data() {
    return {
      title: '迪迪汽车销售系统',
      introduce: '迪迪汽车销售平台 · 专业汽车销售管理解决方案',
    };
  },
};
</script>

<style scoped>
/* 全局样式补充（如果项目未引入Tailwind默认样式） */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 解决高度100%不生效问题 */
html,
body,
#app {
  height: 100%;
}

/* 自定义动画和过渡 */
.el-image {
  border-radius: 8px;
}

/* 表单元素美化（配合LoginForm） */
:deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: none !important;
  border: 1px solid #e5e7eb !important;
  transition: border-color 0.3s;
}

:deep(.el-input__wrapper:focus-within) {
  border-color: #a162f7 !important;
}

:deep(.el-button--primary) {
  background-color: #a162f7 !important;
  border-color: #a162f7 !important;
  border-radius: 8px;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s;
}

:deep(.el-button--primary:hover) {
  background-color: #7c3aed !important;
  transform: translateY(-2px);
}
</style>
