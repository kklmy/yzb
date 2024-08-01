Page({
  data: {
    deviceName: '小悠 BLE版', // 替换为你的设备名称
    deviceImages: [
      '/images/device.png', // 替换为你的设备图片路径
    ],
    isConnected: false, // 全局变量，指示是否连接
  },

  // 在这里添加你的其他函数和逻辑，例如连接蓝牙设备等

  // 假设在连接设备时更新isConnected变量
  connectToDevice(event) {
    // 你的连接设备逻辑
    const that = this;
    wx.createBLEConnection({
      deviceId: event.currentTarget.dataset.deviceId,
      success(res) {
        that.setData({ isConnected: true });
      },
      fail(err) {
        that.setData({ isConnected: false });
      }
    });
  }
});
