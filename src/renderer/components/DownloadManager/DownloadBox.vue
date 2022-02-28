<template>
  <modal
    :visible.sync="visible"
    title="下载文件"
    @close="close()"
  >
    <div class="download-panel">
      <div class="download-header">
        <svg class="filetype icon" aria-hidden="true">
          <use
            :xlink:href="
              fileIcon[type] ? fileIcon[type] : '#iconwenjiangeshi-5'
            "
          ></use>
        </svg>
        <span :title="downloadOptions.filename">{{
          downloadOptions.filename
        }}</span>
      </div>
      <div class="download-body-item">
        <label>文件名称:</label>
        <input
          class="item-input custom-input"
          v-model="reFilename"
          type="text"
          spellcheck="false"
        />
      </div>
      <div class="download-body-item">
        <label>保存路径:</label>
        <div class="file-input">
          <input
            class="item-input custom-input"
            v-model="filePath"
            type="text"
            readonly="readonly"
            spellcheck="false"
          />
          <button
            class="custom-button file-select-button"
            type="default"
            @click="handleDirectory"
          >
            ···
          </button>
        </div>
      </div>
      <span class="download-body-info"
        >{{ $t("download.available") }}：{{
          storageSize | formatFileSize
        }}</span
      >
      <div class="download-footer">
        <h-checkbox v-model="isAgree">{{
          $t("download.checkboxText")
        }}</h-checkbox>

        <div class="flex">
          <button class="download-button" @click="handleDownload">
            {{ $t("download.downloadBtn") }}
          </button>
          <button class="download-button" @click="handleCancel">
            {{ $t("download.cancelBtn") }}
          </button>
        </div>
      </div>
    </div>
  </modal>
</template>

<script>
import Modal from "../Modal";

import { formatFileSize } from "../../utils/utils.js";
const fileIcon = {
  xls: "#iconwenjiangeshi-1",
  xlsx: "#iconwenjiangeshi-1",
  doc: "#iconwenjiangeshi-2",
  docx: "#iconwenjiangeshi-2",
  pdf: "#iconwenjiangeshi-3",
  text: "#iconwenjiangeshi-4",
  html: "#iconwenjiangeshi-6",
  unidentified: "#iconwenjiangeshi-7",
};

export default {
  components: {
    Modal,
  },
  filters: {
    formatFileSize: function (value) {
      return formatFileSize(value);
    },
  },
  data() {
    return {
      type: "unidentified",
      reFilename: "",
      filePath: "",
      isAgree: true,
      storageSize: 0,
      fileIcon,
      downloadOptions: {
        url: "",
        filename: "",
      },
      visible: false,
      downloadSubId: null,
    };
  },
  watch: {
    downloadOptions: {
      handler(val) {
        const filename = val.filename,
          typeIndex = filename.lastIndexOf(".");
        this.type =
          typeIndex !== -1 ? filename.substr(typeIndex + 1) : "unidentified";
        this.reFilename = filename;
        this.filePath = ucf.api.net.downloader.defaultPath;
        this.getDiskInfo();
      },
      deep: true,
    },
  },
  mounted() {
    ucf.api.platform
      .subscribe("download/job/add", (options = {}) => {
        if (options.url) {
          this.visible = true;
          this.downloadOptions = {
            url: options.url,
            filename: options.filename || options.url.split("/").pop(),
          };
        }
      })
      .then((subId) => {
        this.downloadSubId = {
          topic: "download/job/add",
          subId,
        };
      });
  },
  methods: {
    async getDiskInfo() {
      const { platform } = await ucf.api.os.getSystemInfo();
      ucf.api.os.getDiskInfo().then((res) => {
        const caption =
            platform === "win32"
              ? this.filePath.substr(0, 2).toLowerCase()
              : "/",
          drive = res.find((_drive) => _drive.mounted === caption);
        if (drive) {
          this.storageSize = drive.available;
        }
      });
    },
    validateDownload() {
      if (this.reFilename === "" || this.filePath === "") {
        return false;
      }
      return true;
    },
    handleDownload() {
      if (this.validateDownload()) {
        this.close();
        this.$emit("addJob", {
          filename: this.reFilename,
          url: this.downloadOptions.url,
          directory: this.filePath,
          isAgree: this.isAgree,
        });
      }
    },
    handleCancel() {
      this.visible = false;
      this.$emit("update:visible", false);
    },
    async handleDirectory() {
      let options = {
        defaultPath: this.filePath,
        properties: ["openDirectory"],
        filters: [
          {
            name: "All",
            extensions: ["*"],
          },
        ],
      };
      ucf.api.platform.showDialog({ type: "open", options }).then((res) => {
        if (res && !res.canceled) {
          this.filePath = res.filePaths[0];
          this.getDiskInfo();
        }
      });
    },
    close() {
      this.visible = false;
      this.$emit("update:visible", false);
    },
  },
  destroyed() {
    ucf.api.platform.unSubscribe(
      this.downloadSubId.topic,
      this.downloadSubId.subId
    );
  },
};
</script>
<style lang="less">
.download-panel {
  padding: 26px 24px 16px 16px;
  width: 100%;
  background: var(--download-bg-color);
  border-top: 1px solid #ededed;
  display: flex;
  flex-direction: column;
  .download-header {
    margin-bottom: 10px;
    align-items: center;
    display: flex;
    .filetype {
      width: 24px !important;
      height: 20px !important;
    }
    span {
      width: 250px;
      margin-left: 5px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      color: var(--download-font-color);
    }
  }
  .download-body-item {
    align-items: center;
    margin: 4px 0;
    display: flex;
    label {
      color: var(--download-font-color2);
      width: 60px;
    }
    .item-input {
      flex: 1;
      height: 28px !important;
      padding: 8px;
      font-size: 1rem;
      color: var(--download-font-color);
      overflow: hidden;
      border: 1px solid var(--download-input-border-color);
      background: var(--download-input-bg-color);
    }
    .file-input {
      flex: 1;
      display: flex;
      .file-select-button {
        min-width: 30px;
        width: 30px !important;
        height: 28px;
        border-radius: 0 2px 2px 0;
        border: 1px solid var(--download-input-border-color);
        background: var(--download-input-bg-color);
      }
      .item-input {
        border-radius: 2px 0 0 2px;
        border-right: 0;
      }
    }
  }
  .download-body-info {
    margin-left: 60px;
    margin-top: 2px;
    color: var(--download-font-color2);
  }
  .download-footer {
    margin-top: 13px;
    display: flex;
    justify-content: space-between;
    label {
      color: var(--download-font-color);
    }
    .download-button {
      height: 28px;
      padding: 0 14px;
      margin: 0 4px;
      background-color: var(--download-button-bg-color);
      color: var(--download-font-color);
      border: 1px solid var(--download-button-border-color);
      border-radius: 2px;
      font-size: 1rem;
      cursor: pointer;
      &:focus {
        outline: none;
      }
      &:hover {
        border: 1px solid #008bce;
        color: #008bce;
      }
    }
  }
}
</style>
