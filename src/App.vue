<template>
  <div id="app">

    <router-link to="/">Student</router-link> |
    <router-link to="/cohort-view">Cohort</router-link>

    <b-container>
      <router-view />
    </b-container>
  </div>
</template>

<script>
// import StudentView from "./views/StudentView";

export default {
  name: 'App',
  components: {
    // StudentView
  },

  data() {
    return {
      
    }
  }
}
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Open Sans', sans-serif;
  line-height: 1.2;
  background-color: #f7f7f7;
  padding-bottom: 40px;
}

.flat-shadow {
  border-radius: 2px;
  box-shadow: 0 1px 2px rgba(0.1,0.1,0.1,0.1), 0 1px 2px rgba(0.1,0.1,0.1,0.15);
  background-color: white;
  margin-bottom: 25px;
  padding: 15px;
}
</style>
