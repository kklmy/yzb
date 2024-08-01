Page({
  data: {
    sitOptions: [
      { value: 15, text: '15分钟', checked: true },
      { value: 30, text: '30分钟', checked: false },
      { value: 45, text: '45分钟', checked: false },
      { value: 'custom', text: '自定义', checked: false }
    ],
    restOptions: [
      { value: 2, text: '2分钟', checked: true },
      { value: 5, text: '5分钟', checked: false },
      { value: 10, text: '10分钟', checked: false },
      { value: 'custom', text: '自定义', checked: false }
    ],
    customSitTime: false,
    customRestTime: false,
    sitTime: 15,
    restTime: 2,
    isSitting: false,
    isResting: false,
    currentSitTime: 0,
    currentRestTime: 0,
    sitTimer: null,
    restTimer: null,
    postureInterval: null,
    postureMessage: '',
    isTiming: false // 是否开始计时
  },

  setSitTime: function(e) {
    const value = e.detail.value;
    if (value === 'custom') {
      this.setData({ customSitTime: true, sitTime: 0 });
    } else {
      this.setData({ customSitTime: false, sitTime: parseInt(value) });
    }
  },

  customSitTimeInput: function(e) {
    this.setData({ sitTime: parseInt(e.detail.value) });
  },

  setRestTime: function(e) {
    const value = e.detail.value;
    if (value === 'custom') {
      this.setData({ customRestTime: true, restTime: 0 });
    } else {
      this.setData({ customRestTime: false, restTime: parseInt(value) });
    }
  },

  customRestTimeInput: function(e) {
    this.setData({ restTime: parseInt(e.detail.value) });
  },

  startTimer: function() {
    if (!this.data.isTiming) {
      this.setData({
        isSitting: true,
        isResting: false,
        currentSitTime: 0,
        currentRestTime: 0,
        isTiming: true
      });
      this.sitTimer();
    } else {
      this.endTimer();
    }
  },

  sitTimer: function() {
    const sitTimer = setInterval(() => {
      let { currentSitTime, sitTime } = this.data;
      currentSitTime += 1;
      this.setData({ currentSitTime });
      if (currentSitTime >= sitTime) {
        clearInterval(this.data.sitTimer);
        this.setData({ isSitting: false });
        wx.showModal({
          title: '提醒',
          content: '您坐了很久，要站起来活动一下啦~',
          showCancel: false,
          success: () => {
            this.restTimer();
          }
        });
      }
    }, 60000);
    this.setData({ sitTimer });
  },

  restTimer: function() {
    this.setData({ isResting: true });
    const restTimer = setInterval(() => {
      let { currentRestTime, restTime } = this.data;
      currentRestTime += 1;
      this.setData({ currentRestTime });
      if (currentRestTime >= restTime) {
        clearInterval(this.data.restTimer);
        this.setData({ isResting: false });
        wx.showModal({
          title: '提醒',
          content: '休息时间结束，可以继续工作啦~',
          showCancel: false,
          success: () => {
            this.startTimer();
          }
        });
      }
    }, 60000);
    this.setData({ restTimer });
  },

  endTimer: function() {
    clearInterval(this.data.sitTimer);
    clearInterval(this.data.restTimer);
    this.setData({
      isSitting: false,
      isResting: false,
      currentSitTime: 0,
      currentRestTime: 0,
      postureMessage: '',
      isTiming: false
    });
    wx.showToast({
      title: '计时已提前结束',
      icon: 'none',
      duration: 2000
    });
  },

  startPostureCheck: function() {
    const app = getApp();
    const postureInterval = setInterval(() => {
      const currentPosture = app.globalData.currentPosture;
      if (currentPosture !== '标准' && currentPosture !== '起身') {
        app.setPosture(currentPosture);
      }
    }, 1000);
    app.setPostureCallback((posture) => {
      this.setData({ postureMessage: `请注意坐姿哦，现在您是 ${posture}` });
    });
    this.setData({ postureInterval });
  },

  onLoad: function () {
    this.startPostureCheck();
  },

  onUnload: function () {
    clearInterval(this.data.postureInterval);
  }
});
