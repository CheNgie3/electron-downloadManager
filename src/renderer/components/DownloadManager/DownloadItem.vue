<template>
  <div :class="['manager-item', cross ? 'grey' : '']" v-if="item">
    <div class="manager-item-fileIcon">
      <svg class="filetype icon" aria-hidden="true">
        <use
          :xlink:href="
            fileIcon[fileType] ? fileIcon[fileType] : '#iconwenjiangeshi-5'
          "
        />
      </svg>
      <svg class="filestatus icon" aria-hidden="true">
        <use :xlink:href="statusIcon[state]" />
      </svg>
    </div>
    <div class="manager-item-content">
      <span class="content-filename" :title="filename || options.filename">{{
        filename || options.filename
      }}</span>
      <span v-if="state === STATUS.DONE">{{
        totalBytes | formatFileSize
      }}</span>
      <span v-else-if="state === STATUS.PROGRESS || state === STATUS.PAUSE">
        {{ receivedBytes | formatFileSize }}/{{ totalBytes | formatFileSize }}
      </span>
      <span v-else-if="state === STATUS.LINKING">正在连接资源</span>
      <span v-else-if="state === STATUS.FAILED" class="failed">下载失败，请检查网络状况</span>
    </div>
    <div class="manager-item-operate">
      <i
        v-if="state === STATUS.LINKING || state === STATUS.PROGRESS"
        class="operateIcon iconfont iconzanting1"
        @click="pause()"
      ></i>
      <i
        v-if="state === STATUS.PAUSE"
        class="operateIcon iconfont iconkaishi1"
        @click="resume()"
      ></i>
      <i
        v-if="state === STATUS.FAILED"
        class="operateIcon iconfont iconzhongshi"
        @click="restart()"
      ></i>
      <i
        v-if="state === STATUS.DONE"
        class="operateIcon iconfont icondakai"
        @click="openFile()"
      ></i>
      <svg
        :class="['operateIcon icon', this.filepath === '' ? 'disabled' : '']"
        aria-hidden="true"
        @click="openDirectory()"
      >
        <use xlink:href="#iconwenjianjia" />
      </svg>
      <i
        class="operateIcon iconfont iconshanchu"
        @click="deletenItem()"
      ></i>
    </div>
    <div
      class="downloading-mask"
      :style="maskStyle"
      v-if="state === 1 || state === 2"
    ></div>
  </div>
</template>
<script>
import { formatFileSize } from "../../utils/utils.js";
const STATUS = {
    LINKING: 0, //连接中
    PROGRESS: 1, //下载中
    PAUSE: 2, //暂停
    FAILED: 3, //下载失败
    DONE: 4, //已完成
  },
  fileIcon = {
    xls: "#iconwenjiangeshi-1",
    xlsx: "#iconwenjiangeshi-1",
    doc: "#iconwenjiangeshi-2",
    docx: "#iconwenjiangeshi-2",
    pdf: "#iconwenjiangeshi-3",
    text: "#iconwenjiangeshi-4",
    html: "#iconwenjiangeshi-6",
    unidentified: "#iconwenjiangeshi-7",
  },
  statusIcon = {
    0: "#iconxiazaizhongzhuangtai",
    1: "#iconxiazaizhongzhuangtai",
    2: "#iconxiazaizhongzhuangtai",
    3: "#iconxiazaishibai",
    4: "#iconxiazaichenggong",
  },
  statusOperateIcon = {
    0: "iconfont iconzanting1",
    1: "iconfont iconzanting1",
    2: "iconfont iconkaishi1",
    3: "iconfont iconzhongshi",
    4: "iconfont icondakai",
  };

const logger = console.log;
export default {
  props: {
    options: {
      type: Object,
      default: () => ({}),
    },
    cross: {
      type: Boolean,
      default: false,
    },
  },
  filters: {
    formatFileSize: function (value) {
      if (typeof value === "number") {
        return formatFileSize(value);
      } else {
        return "未知";
      }
    },
  },
  computed: {
    maskStyle() {
      return {
        width: (this.receivedBytes / this.totalBytes).toFixed(2) * 100 + "%",
      };
    },
    fileType() {
      const value = this.options.filename;
      if (!value) {
        return "unidentified";
      }
      let typeIndex = value.lastIndexOf(".");
      return typeIndex !== -1 ? value.substr(typeIndex + 1) : "unidentified";
    },
  },
  watch: {
    //监听自身wait，当wait一设为false则立马开始下载
    "options.wait": {
      handler(newVal) {
        if (!newVal) {
          this.item.start();
        }
      },
      deep: true,
    },
    filename(newVal) {
      //将filename、filepath、totalBytes存储于storage，使刷新或下次启动时正常显示。
      this.options.filename = newVal;
      this.options.filepath = this.item.filePath;
      // this.options.totalBytes = this.totalBytes;
      this.item.resumed = true; //当第一次接收到数据时设置续传状态，避免未在本地创建资源就设为续传状态造成同名文件冲突
      this.options.resumed = true;
      this.$emit("filenameChange", this.options);
    },
  },
  mounted() {
    //生成下载实例
    const progress = (receivedBytes) => {
        //当接收到数据时,将其state设为PROGRESS，获取返回的真实文件名，获取实时BtyeSize；
        this.state = STATUS.PROGRESS;
        let filepath = this.item.filePath;
        this.filepath = filepath;
        this.filename = filepath.substr(filepath.lastIndexOf("\\") + 1);
        this.receivedBytes = receivedBytes;
        // this.totalBytes = totalBytes;
      },
      success = () => {
        this.state = STATUS.DONE;
        this.optionsChange();
        //isAgree判断下载完是否自动打开
        if (this.options.isAgree === true) {
          this.openFile();
        }
      },
      error = () => {
        this.state = STATUS.FAILED;
        this.optionsChange();
      };
    this.item = ucf.api.net.downloader({
      ...this.options,
      progress: progress,
      success: success,
      error: error,
    });
    if (this.item) {
      this.item.resumed = this.options.resumed || false; //是否为续传
      this.state = this.options.state;
      this.filepath = this.options.filepath || "";
      this.receivedBytes = this.options.receivedBytes;
      fetch(this.options.url, {
        method: "head",
      }).then((response) => {
        this.totalBytes =
          parseInt(response.headers.get("Content-Length")) || "undefined";
      });
      //当wait为false且state为progress和linking，立马下载
      if (!this.options.wait && this.state <= STATUS.PROGRESS) {
        this.item.start();
      }
    } else {
      // 实例化失败！
      this.deletenItem();
    }
  },
  data() {
    return {
      STATUS,
      fileIcon,
      statusIcon,
      statusOperateIcon,
      state: STATUS.LINKING, //状态默认为STATUS.LINKING
      item: null,
      filename: "",
      filepath: "",
      receivedBytes: "",
      totalBytes: "",
    };
  },
  methods: {
    async resume() {
      this.state = STATUS.LINKING;
      this.optionsChange(); //监听外部改变的wait，是否立马开始继续下载
    },
    async pause() {
      await this.item.pause();
      this.state = STATUS.PAUSE;
      //暂停时storage存储receivedBytes；若不暂停则刷新或重新启动后会直接续传，无需存储receivedBytes
      this.options.receivedBytes = this.receivedBytes;
      this.optionsChange();
    },
    openFile() {
      ucf.api.fs.openPath(this.filepath).catch((error) => logger(error));
    },
    restart() {
      this.state = STATUS.LINKING;
      this.item.resumed = false; //失败后重新开始下载时无需续传
      this.optionsChange();
    },
    //state变化时会传出optionsChange事件
    optionsChange() {
      this.options.state = this.state;
      this.$emit("optionsChange", this.options);
    },

    openDirectory() {
      ucf.api.fs
        .showItemInFolder(this.filepath)
        .catch((error) => logger(error));
    },
    deletenItem() {
      this.$emit("on-delete");
    },
  },
  async beforeDestroy() {
    // 重要！ 利用 pause 回收请求对象
    if (this.item) {
      await this.item.pause();
    }
  },
};
</script>
<style lang="less" scoped>
.manager-item {
  width: 100%;
  height: 58px;
  align-items: center;
  padding: 11px 16px;
  position: relative;
  display: flex;
  .manager-item-fileIcon {
    height: 27px;
    width: 28px;
    position: relative;
    margin-right: 4px;
    z-index: 1;
    .filetype {
      width: 22px !important;
      height: 20px !important;
    }
    .filestatus {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 16px !important;
      height: 16px !important;
    }
  }
  .manager-item-content {
    display: flex;
    flex-direction: column;
    width: 255px;
    align-content: space-around;
    font-size: 1rem;
    color: var(--download-font-color);
    z-index: 1;
    .content-filename {
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }
    .failed {
      color: var(--download-failed-font-color);
    }
  }
  .manager-item-operate {
    display: flex;
    align-items: center;
    z-index: 1;
    justify-content: space-around;
    width: 80px;
    .operateIcon {
      color: var(--download-font-color2);
      cursor: pointer;
      &:hover {
        color: #008bce;
      }
    }
    .disabled {
      &:hover {
        color: var(--download-font-color2);
        cursor: progress;
      }
    }
    .icon {
      width: 16px !important;
      height: 16px !important;
    }
  }
  .downloading-mask {
    position: absolute;
    top: 0;
    left: 0;
    background-color: var(--download-item-mask-background-color);
    border: 1px solid var(--download-item-mask-border-color);
    height: 100%;
  }
}
.grey {
  background-color: var(--download-item-background-color);
}
</style>
