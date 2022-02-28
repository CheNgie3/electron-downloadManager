/*
 * 文件大小单位处理
 * @param {Number} value
 */
function formatFileSize(value) {
    if (value === 0) {
      return '0 B';
    }
    const k = 1024,
      sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = Math.floor(Math.log(value) / Math.log(k));
    return (value / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  }

  
export {
    formatFileSize,
  };
  