
const child_process = require("child_process");
const util = require('util');
const exec = util.promisify(child_process.exec);

let callback, target, threshold = 2000, stopped = false;

async function start(_target = 'www.baidu.com', _callback = () => {}) {
  target = _target;
  callback = () => {
    stop();
    _callback();
  };
  stopped = false;
  threshold = 2000;
  console.log(callback, target, threshold, stopped);
  check();
}


async function check() {
  console.log('checking...' + threshold)
  exec(`curl -I ${target}`).then(callback).catch((e) => {
    if(stopped) { return }
    setTimeout(() => {
      if(stopped) { return }
      threshold *= 2;
      check();
    }, threshold);
  })
}

async function stop() {
  stopped = true;
}

module.exports = {
  startNetCheck: start,
  stopNetCheck: stop
}