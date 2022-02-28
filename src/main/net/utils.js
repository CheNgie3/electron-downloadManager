const { stringify } = require('querystring');

function isObjectLike(value) {
  return typeof value === 'object' && value !== null
}

function getTag(value) {
  if (value == null) {
    return value === undefined ? '[object Undefined]' : '[object Null]'
  }
  return toString.call(value)
}

function isPlainObject(value) {
  if (!isObjectLike(value) || getTag(value) != '[object Object]') {
    return false
  }
  if (Object.getPrototypeOf(value) === null) {
    return true
  }
  let proto = value
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto)
  }
  return Object.getPrototypeOf(value) === proto
}

// 请求方法处理及参数处理，参数处理是否必要存疑
function makeDataOption(options) {
  const { method = 'GET', data, url} = options;
  options.method = method.toUpperCase();

  if (isPlainObject(data) && options.method === 'GET') {
    const params = stringify(data);
    options.url = url.indexOf('?') > -1 ? (`${url}&${params}`) : (`${url}?${params}`);
  }

  if (options.method !== 'GET') {
    options.body =  data || options.body;
  }

  options.timeout = options.timeout || 10000;
  return options;
}


module.exports = {
  isPlainObject,
  makeDataOption
}