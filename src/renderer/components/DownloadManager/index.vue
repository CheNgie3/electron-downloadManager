<template>
  <div>
    <modal
      :visible="value"
      :minimizable="true"
      title="下载管理器"
      @close="close"
      @minimize="close"
    >
      <div class="manager-panel">
        <div class="manager-body">
          <download-item
            v-for="(item, index) in downloadList"
            :key="item.id"
            :cross="index % 2 == 1"
            :options="item"
            @on-delete="deleteItem(item.id)"
            @optionsChange="optionsChange"
            @filenameChange="filenameChange"
          />
        </div>
        <div class="manager-footer">
          <button class="custom-button clean-btn" @click="cleanList">
            清空列表
          </button>
        </div>
      </div>
    </modal>
    <download-box @addJob="addJob"></download-box>
  </div>
</template>
<script>
import Modal from "../Modal";
import DownloadItem from "./DownloadItem";
import DownloadBox from "./DownloadBox";
import { bindWindowEvent, removeWindowEvent } from "../../utils/dom";
let id = 0;
const maxDownloadCount = 5,
  STATUS = {
    LINKING: 0,
    PROGRESS: 1,
    PAUSE: 2,
    FAILED: 3,
    DONE: 4
  };
export default {
  components: {
    Modal,
    DownloadItem,
    DownloadBox
  },

  async mounted() {
    //初始化时从storager中取出downloadItems,根据wait和state统计目前下载量downloadCount
    let downloadList = (await ucf.api.storage.get("downloadList")) || "[]";
    downloadList = JSON.parse(downloadList);
    downloadList.forEach(options => {
      // 取出的对象带有响应式，浅拷贝处理掉
      let item = { ...options };
      this.addItem(item);
    });

    // 刷新或关闭页面时
    bindWindowEvent("beforeunload", this.clear, false);
  },
  props: {
    value: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      downloadList: [],
      downloadCount: 0
    };
  },
  methods: {
    close() {
      this.$emit("input", false);
    },
    addJob(item) {
      this.$emit("input", true);
      this.addItem(item);
    },
    addItem(item) {
      item.id = ++id; //key唯一值
      item.state = item.state ? item.state : STATUS.LINKING;
      if (
        item.state <= STATUS.PROGRESS &&
        this.downloadCount < maxDownloadCount
      ) {
        this.downloadCount++;
        item.wait = false;
      } else {
        item.wait = true;
      }
      this.downloadList.push(item);
    },
    deleteItem(id) {
      const index = this.downloadList.findIndex(d => d.id === id);
      if (index > -1) {
        if (this.downloadList[index].wait === false) {
          this.downloadCount--;
        }
        this.downloadList.splice(index, 1);
      }
    },
    cleanList() {
      this.downloadList = [];
      this.downloadCount = 0;
    },
    //optionsChange控制manager的目前下载量downloadCount和item的wait状态
    //manager根据item的state变化来维护wait和count,而downloadItem内部根据wait变化和state判断是否立刻下载
    //state:done、failed-----wait:true 不参与下载队列
    //state:pause-----wait:true 暂停下载，不参与时下载队列，除非点击开始按钮，状态置为linking等待下载
    //state：linking、progress-----wait：false 正在下载
    //state：linking、progress-----wait：true  等待下载，若当前下载量<max时，会将其wait设为false立刻下载
    optionsChange(options) {
      const index = this.downloadList.findIndex(d => d.id === options.id);
      if (index > -1) {
        //当正在下载的state变为下载暂停/失败/完成时，目前下载量downloadCount--
        if (!options.wait && options.state >= STATUS.PAUSE) {
          options.wait = true;
          this.downloadList[index] = options;
          this.downloadCount--;
        } else if (
          options.state <= STATUS.PROGRESS &&
          this.downloadCount < maxDownloadCount
        ) {
          //当state变为PAUSE->LINKING时，目前下载量小于max,则使其立刻开始下载，downloadCount++
          options.wait = false;
          this.downloadList[index] = options;
          this.downloadCount++;
        }
      }
    },
    filenameChange(options) {
      const index = this.downloadList.findIndex(d => d.id === options.id);
      if (index > -1) {
        this.downloadList[index] = options;
      }
    },
    async clear() {
      const downloadList = JSON.stringify(this.downloadList); // 深拷贝，保证 plainobject
      //将downloadList存储于storage，持久化
      await ucf.api.storage.set("downloadList", downloadList);
      this.downloadList = [];
    }
  },
  watch: {
    downloadCount: {
      handler(newVal) {
        if (newVal < maxDownloadCount) {
          //查找列表中wait状态为true且state为Linking的item
          const index = this.downloadList.findIndex(
            d => d.wait === true && d.state <= STATUS.PROGRESS
          );
          if (index > -1) {
            this.downloadCount++;
            this.downloadList[index].wait = false;
          }
        }
      },
      immediate: true
    }
  },
  beforeDestroy() {
    this.clear();
    removeWindowEvent("beforeunload", this.clear, false);
  }
};
</script>
<style lang="less" scoped>
.manager-panel {
  width: 100%;
  overflow: hidden;
  background: var(--download-bg-color);
  border-radius: 0 0 2px 2px;
  border-top: 1px solid #ededed;
  .manager-body {
    display: flex;
    flex-direction: column;
    height: 234px;
    overflow: auto;
  }
  .manager-footer {
    padding: 16px 15px;
    .clean-btn {
      height: 28px;
      line-height: 28px;
      width: 76px;
      font-size: 1rem;
      background-color: var(--download-button-bg-color);
      color: var(--download-font-color);
      border: 1px solid var(--download-button-border-color);
    }
  }
}
</style>
