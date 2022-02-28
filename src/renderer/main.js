import Vue from "vue";
import App from "./App";
// import router from "./router";

import "./styles/style.less"
import './assets/font/iconfont.css';
import './assets/font/iconfont.js';

Vue.config.productionTip = false;

new Vue({
    // router,
    render: function(h) {
        return h(App);
      },
}).$mount('#app');