<template>
  <div class="main-wrapper">
    <div class="header"></div>
    <button @click="showDownloadManager = true">
      <i class="iconfont iconxiazaiguanli"></i>下载管理器
    </button>

    <!-- 下载管理器 -->
    <download-manager v-model="showDownloadManager"></download-manager>
  </div>
</template>

<script>
import DownloadManager from "../components/DownloadManager";

export default {
  components: {
    DownloadManager,
  },
  data() {
    return {
      showDownloadManager: false,
    };
  },
};
</script>

<style lang="less" scoped>
.main-wrapper {
  width: 100%;
  height: 100%;
  background: #fff;
  .header {
    height: 40px;
    display: flex;
    justify-content: space-around;
    background: rgb(235, 225, 172);
  }
}
</style>
