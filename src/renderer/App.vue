<template>
  <div id="app" class="theme-light">
     <!-- <router-view /> -->
     <home />
  </div>
</template>

<script>
import Home from './views/Main.vue'

export default {
  name: 'App',
  components: {
    Home
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>