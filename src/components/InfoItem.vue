<template>
    <div id="info-item">
        <b>{{ name }}</b>
        <br>
        <span>{{ value }}</span>
    </div>
</template>

<script>
export default {
    name: "InfoItem",
    props: {
        name: String,
        value: String
    }
}
</script>

<style scoped>
b {
  font-size: 12px;
  text-transform: uppercase;
}

span {
  font-size: 28px;
  font-weight: 100;
}
</style>