<template>
  <div v-show="visible" class="modal">
    <div class="mask" :style="maskStyle"></div>
    <div class="modal-panel" :style="styles">
      <div class="modal-header" v-if="showToolBar">
        <div class="title">{{title}}</div>
        <i
          v-if="closable"
          class="iconfont iconclose-mini"
          @click="close"
        />
      </div>

      <div class="modal-body">
        <slot></slot>
      </div>

      <div class="modal-footer">
        <slot name="action">
          <!-- <button class="modal-button" type="primary" @click="confirm">确定</button>
          <button class="modal-button" @click="close">取消</button> -->
        </slot>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      default: "",
    },
    width: {
      type: Number,
      default: 400,
    },
    maximizable: {
      type: Boolean,
      default: false,
    },
    minimizable: {
      type: Boolean,
      default: false,
    },
    closable: {
      type: Boolean,
      default: true,
    },
    maskStyle: {
      type: Object,
      default: () => {},
    },
    showToolBar: {
      type: Boolean,
      default: true,
    },
  },
  computed: {
    styles() {
      return {
        width: this.width + "px",
      };
    },
  },

  methods: {
    close() {
      this.$emit("close");
    },
    confirm() {
      this.$emit("confirm");
    },
  },
};
</script>
<style lang="less" scoped>
.modal {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 99;
  .modal-panel {
    // min-width: 30%;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    color: var(--modal-color);
    box-shadow: 0 3px 8px 0 var(--modal-mask);
    background: var(--modal-bg);
    border-radius: 2px;
    z-index: 99;
  }
  .modal-footer {
    width: 100%;
    padding: 0 12px;
    background: var(--modal-bg);
  }
  .modal-header {
    height: 28px;
    line-height: 28px;
    border-radius: 2px 2px 0 0;
    padding: 0 12px;
    background: var(--modal-bg);
    position: relative;
    .title {
      font-weight: bold;
    }
    .iconclose-mini {
      cursor: pointer;
      position: absolute;
      right: 8px;
      top: 0;
    }
  }
  .modal-footer {
    display: flex;
    flex-direction: row-reverse;
  }
  .mask{
    width: 100%;
    height: 100%;
    background: rgba(51, 51, 51, 0.5);
  }
}

</style>