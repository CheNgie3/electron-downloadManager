// window 事件
function bindWindowEvent(eventName, func, options) {
  window.addEventListener(eventName, func, options);
}
function removeWindowEvent(eventName, func, options) {
  window.removeEventListener(eventName, func, options);
}

export { bindWindowEvent, removeWindowEvent };
