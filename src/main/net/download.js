const { net, app } = require('electron');
const fs = require('fs');
const path = require('path');
const DOWNLOAD_PATH = app.getPath('downloads');

const incrementer = (filePath) => {
  let counter = 0;
  return () =>
    ucf.fs.rename(
      filePath,
      (filename, extension) => `${filename} (${++counter})${extension}`,
    );
};

const unusedFilename = (filePath) => {
  const getFilePath = incrementer(filePath);
  const find = async (newFilePath) =>
    (await ucf.fs.access(newFilePath)) ? find(getFilePath()) : newFilePath;
  return find(filePath);
};

class Download {
  constructor(options) {
    this.options = options;

    this.resumed = false;
    this.receivedBytes = 0;
    this.totalBytes = 0;
    this.request = null;
    this.filePath = '';
  }

  async start() {
    let {
      url,
      method,
      headers,
      body,
      directory = DOWNLOAD_PATH,
      filename,
      progress,
      error,
      success,
    } = this.options;

    this.filePath = this.filePath || path.join(directory, filename);
    const fileAccess = await ucf.fs.access(this.filePath);
    const stats = fileAccess ? await fs.promises.stat(this.filePath) : null;

    // 友好操作 方便获取总字节数
    headers = {
      Range: 'bytes=0-',
      ...headers,
    };

    // 文件已存在 断点续传
    if (stats && this.resumed) {
      this.receivedBytes = stats.size;
      headers = {
        ...headers,
        Range: `bytes=${this.receivedBytes}-`,
      };
    }

    // 文件已存在 不是续传 修改文件名为 finame(num).ext
    if (stats && !this.resumed) {
      this.filePath = await unusedFilename(this.filePath);
    }

    return new Promise((resolve, reject) => {
      const request = net.request({
        url,
        method,
      });

      this.request = request;

      if (headers) {
        Object.keys(headers).forEach((h) => {
          request.setHeader(h, headers[h]);
        });
      }

      if (body) {
        request.write(body);
      }

      let file = fs.createWriteStream(this.filePath, {
        start: this.receivedBytes,
        // 续传时追加内容 否则直接写入
        flags: this.resumed ? 'a+' : 'w',
      });

      request.on('response', (response) => {
        // 数据总长度依据以 rangeLength 为主
        const contentLength =
          parseInt(response.headers['content-length'], 10) || 0;
        const rangeLength = response.headers['content-range'];
        let totalBytes = 0;
        totalBytes = contentLength + this.receivedBytes;
        if (rangeLength) {
          let [, total] = rangeLength.match(/\/(\d*)/);
          totalBytes = parseInt(total, 10) || 0;
        }

        this.totalBytes = totalBytes;

        response.pipe(file);

        request.getUploadProgress();

        response.on('data', (chunk) => {
          this.receivedBytes += chunk.length;
          typeof progress === 'function' &&
            progress(this.receivedBytes, this.totalBytes);
        });

        response.on('error', (e) => {
          typeof error === 'function' && error(e);
          reject(e);
        });

        response.on('end', () => {
          typeof success === 'function' && success(true);
          resolve(true);
        });
      });

      request.on('error', (e) => {
        typeof error === 'function' && error(e);
        reject(e);
      });
      request.end();
    });
  }

  async pause() {
    // if node version >= 14.1.0 use destroy()
    if (this.request) {
      this.request.abort && this.request.abort();
      this.request.destroy && this.request.destroy();
      this.request.end();
    }
    this.request = null;
  }

  async resume() {
    await this.pause();
    this.resumed = true;
    return await this.start();
  }
}

Download.defaultPath = DOWNLOAD_PATH;

module.exports = Download;
