const app = getApp();

Page({
  data: {
    userInfo: {
      avatarUrl: '',
      nickName: '',
    },
    height: '',
    weight: '',
    selectedOption: 'month',
    currentChart: '/path/to/month-chart.png', // 初始图表
  },

  onLoad: function () {
    const { userInfo } = app.globalData;
    if (userInfo) {
      this.setData({
        userInfo: userInfo
      });
    }
  },

  onHeightChange(e) {
    this.setData({
      height: e.detail.value
    });
  },

  onWeightChange(e) {
    this.setData({
      weight: e.detail.value
    });
  },

  showMonth() {
    this.setData({
      selectedOption: 'month',
      currentChart: '../../images/month.png' // 替换为你云端月数据图表路径
    });
  },

  showWeek() {
    this.setData({
      selectedOption: 'week',
      currentChart: '../../images/week.png' // 替换为你云端周数据图表路径
    });
  },

  showDay() {
    this.setData({
      selectedOption: 'day',
      currentChart: '../../images/day.png' // 替换为你云端日数据图表路径
    });
  }
});
