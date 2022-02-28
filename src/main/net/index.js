const { app, session, BrowserWindow, net } = require('electron');
const Downloader = require('./download');
const { startNetCheck, stopNetCheck } = require('./checkStatus');
const httpRequest = require('http').request;
const httpsRequest = require('https').request;
const { SocksProxyAgent } = require('socks-proxy-agent');
const { makeDataOption } = require('./utils');
const { platform } = ucf.api ? ucf.api : ucf;
class Net extends ucf.Base {
  static pluginName = 'net';

  constructor() {
    super();
    this.proxyMemo = null;
    this.downloader.defaultPath = Downloader.defaultPath;
  }

  startNetCheck() {
    return startNetCheck();
  }

  stopNetCheck() {
    return stopNetCheck();
  }

  download(options) {
    if(!platform){
      throw new Error("needs require platform api")
    }
    platform.publish("download/job/add", options);
  }

  getSocksProxyAgent(proxy) {
    // if(socksAgent) {
    //   return socksAgent
    // }
    return new SocksProxyAgent({
      host: proxy.address,
      port: proxy.port,
      protocol: proxy.type + ':',
      userId: proxy.username,
      password: proxy.password,
      // maxSockets: 20
    });
  }

  async fetch(url, options = {}) {
    if (this.proxyMemo && this.proxyMemo.type.startsWith('socks')) {
      return this.fetchBySocks(url, options);
    } else {
      return this.fetchByNet(url, options);
    }
    // return fetchByNet(url, options)
  }

  async fetchByNet(url, options = {}) {
    await app.whenReady();
    options = makeDataOption(options);
    const _defaultOptions = options.useSessionCookies
      ? { useSessionCookies: true, session: session.defaultSession }
      : { useSessionCookies: false };
    const request = net.request({
      url,
      method: options.method,
      ..._defaultOptions,
    });

    if (options.headers)
      Object.keys(options.headers).forEach((h) => {
        request.setHeader(h, options.headers[h]);
      });
    if (options.body) request.write(options.body);

    return await new Promise((resolve, reject) => {
      //拼接buffer,等所有chunk接受完毕再转字符串，否则会不定期出现乱码问题
      let result = Buffer.from([]);
      let data = '';
      request.on('response', (response) => {
        response.on('data', (chunk) => {
          //拼接buffer,等所有chunk接受完毕再转字符串，否则会不定期出现乱码问题
          result = Buffer.concat([result, chunk]);
        });
        response.on('end', () => {
          data = result.toString();
          if (options.type === 'json') {
            try {
              const jsonData = JSON.parse(data);
              typeof options.success === '' && options.success(jsonData);
              resolve(jsonData);
            } catch (error) {
              typeof options.error === '' && options.error(error);
              reject(error);
            }
          } else {
            typeof options.success === '' && options.success(data);
            return resolve(data);
          }
        });
        response.on('error', (error) => {
          typeof options.error === '' && options.error(error);
          reject(error);
        });
      });
      request.on('error', (error) => {
        typeof options.error === '' && options.error(error);
        reject(error);
      });
      request.on('timeout', () => {
        request.destroy();
      });
      request.end();
    });
  }

  async fetchBySocks(url, options = {}) {
    await app.whenReady();

    const agent =
      this.proxyMemo && this.proxyMemo.type.startsWith('socks')
        ? this.getSocksProxyAgent(this.proxyMemo)
        : undefined;
    // ucf.logger.warn(agent);
    options = makeDataOption(options);
    const requestOptions = {
      method: options.method,
      headers: options.headers,
      agent,
    };

    return new Promise((resolve, reject) => {
      function handler(res) {
        let result = Buffer.from([]);
        let data = '';
        res.on('data', (chunk) => {
          result = Buffer.concat([result, chunk]);
        });

        res.on('end', () => {
          data = result.toString();
          if (options.type === 'json') {
            try {
              const jsonData = JSON.parse(data);
              typeof options.success === '' && options.success(jsonData);
              resolve(jsonData);
            } catch (error) {
              typeof options.error === '' && options.error(error);
              reject(error);
            }
          } else {
            typeof options.success === '' && options.success(data);
            return resolve(data);
          }
        });
      }
      const req = (url.startsWith('https') ? httpsRequest : httpRequest)(
        url,
        requestOptions,
        handler
      );
      req.on('timeout', () => {
        request.destroy();
      });

      req.on('error', (error) => {
        typeof options.error === '' && options.error(error);
        reject(error);
      });
      if (options.body) req.write(options.body);
      req.end();
    });
  }

  /**
   * 用于下载资源并且获取下载进度
   * @param {*} options 请求参数
   * @param {*} options.url 资源下载的地址
   * @param {*} options.filename 用户命名的文件名
   * @param {*} options.headers 资源下载请求时的请求头
   * @param {*} options.method 资源下载请求时请求方法
   * @param {*} options.data GET：在 url 后追加；POST：请求体
   * @param {*} options.directory 下载的文件存储所在的目录，默认为用户的Download目录 app.getPath('downloads')
   * @param {*} success 下载成功时的回调
   * @param {*} error 下载失败时的回调
   * @param {*} progress 下载进度回调
   *
   */
  downloader(options = {}) {
    const { filename, url } = options;

    if (!filename || !url) {
      return false;
    }
    options = makeDataOption(options);
    return new Downloader(options);
  }
  /**
   * 建立websocket链接
   * @param {*} option 参数
   */
  createWebsocket(option) {
    const WebSocket = require('ws');
    let ws = new WebSocket(option.url);
    ws.on('open', option.onOpen);
    ws.on('message', option.onMessage);
    ws.on('close', () => {
      option.onClose && option.onClose();
    });
    ws.on('error', () => {
      option.onError && option.onError();
    });
    return ws;
  }

  /**
   * 设置代理
   * @param {*} proxy
   */
  async setProxy(proxy, winId) {
    await app.whenReady();
    if (proxy && proxy.type.startsWith('socks')) {
      await this.emptyProxy();
      this.proxyMemo = proxy;
      return;
    }
    // this.proxyMemo = proxy;
    const ses = session.defaultSession;
    await ses.clearAuthCache();
    await ses.clearCache();
    await ses.setProxy({
      proxyRules: `${proxy.type}://${proxy.address}:${proxy.port}`,
      proxyBypassRules: '',
    });
    ucf.logger.warn('set proxy success');
    const { username, password } = proxy;
    return new Promise((resolve) => {
      const bw = new BrowserWindow({
        show: false,
        webPreferences: { session: ses },
      });
      bw.webContents.on('login', (event, details, authInfo, cb) => {
        ucf.logger.warn('shadow win login');
        if (authInfo.isProxy) {
          ucf.logger.warn('shadow win login');
          event.preventDefault();
          cb(username, password);
          bw.close();
          resolve();
        }
      });
      // 这里用不放通，不能await
      bw.loadURL(`${proxy.type}://${proxy.address}:${proxy.port}`);
      if (!(username && password)) {
        resolve();
      }
    });
  }

  /**
   * 取消网络代理
   * @param {*} options
   */
  async emptyProxy() {
    this.proxyMemo = null;
    const ses = session.defaultSession;
    return ses.setProxy({
      proxyRules: `direct://`,
    });
  }

  resolveProxy(url) {
    const ses = session.defaultSession;
    return ses.resolveProxy(url);
  }
}

module.exports = Net;
