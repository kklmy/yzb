// app.ts
App({
  //设置全局变量，方便其他页面调用
  globalData: {
    isConnected:false,
    currentPosture:'',
    postureCount:0,
    postureCallback:null,
    userInfo: {
      avatarUrl: '',
      nickName: ''
    }
  },
  setPosture: function(posture) {
    const globalData = this.globalData;
    if (posture === globalData.currentPosture) {
      globalData.postureCount++;
    } else {
      globalData.postureCount = 1;
    }
    globalData.currentPosture = posture;
    if (globalData.postureCount >= 20 && globalData.currentPosture !== '标准' && globalData.currentPosture !== '起身') {
      if (globalData.postureCallback) {
        globalData.postureCallback(globalData.currentPosture);
      }
    }
  },

  setPostureCallback: function(callback) {
    this.globalData.postureCallback = callback;
  },

  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        console.log(res.code)
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      },
    })
  },
})