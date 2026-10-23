<template>
  <div class="loader-container">
    <span class="loader" />
  </div>
</template>
<script setup lang="ts"></script>
<style scoped lang="scss">
.loader-container {
  --loader-color: #ff0000;
  --loader-size: 1px;

  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  .loader {
    width: calc(48 * var(--loader-size));
    height: calc(48 * var(--loader-size));
    border: calc(5 * var(--loader-size)) solid var(--loader-color);
    border-bottom-color: transparent;
    border-radius: 50%;
    display: inline-block;
    box-sizing: border-box;
    animation: rotation 1s linear infinite;
  }
}

@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
