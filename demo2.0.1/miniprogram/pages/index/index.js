const ecUI = require('../../utils/ecUI.js')
const ecBLE = require('../../utils/ecBLE.js')

const app = getApp()
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'
let ctx

Page({
  data: {
    deviceListData: [],
    deviceListDataShow: [],
    deviceId: '',
    serviceId: '',
    characteristicId: '',
    receivedData: '',
    devices: [],
    isScanning: false,
    userInfo: {
      avatarUrl: defaultAvatarUrl,
      nickName: '',
    },
    hasUserInfo: false,
    canIUseGetUserProfile: wx.canIUse('getUserProfile'),
    canIUseNicknameComp: wx.canIUse('input.type.nickname'),
    isConnected: false,
    connectedDeviceName: '',
    bluetoothOn: false,
  },


  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    const { nickName } = this.data.userInfo;
    this.setData({
      "userInfo.avatarUrl": avatarUrl,
      hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
    });
    this.updateGlobalUserInfo();
  },

  onInputChange(e) {
    const nickName = e.detail.value;
    const { avatarUrl } = this.data.userInfo;
    this.setData({
      "userInfo.nickName": nickName,
      hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
    });
    this.updateGlobalUserInfo();
  },

  getUserProfile(e) {
    wx.getUserProfile({
      desc: '展示用户信息',
      success: (res) => {
        console.log(res);
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        });
        app.globalData.userInfo = res.userInfo;
      }
    });
  },

  updateGlobalUserInfo() {
    app.globalData.userInfo = this.data.userInfo;
  },

  navigateToDevice() {
    wx.switchTab({
      url: '../device/device'
    });
  },
  onLoad() {
    ctx = this
    setInterval(()=>{
      ctx.setData({
        deviceListDataShow:ctx.data.deviceListData
      })
    },400)
  },
  onShow() {
    ctx.setData({ deviceListData:[] })
    ctx.setData({ deviceListDataShow:[] })
    setTimeout(() => {
      ctx.openBluetoothAdapter()
    }, 100);
  },
  listViewTap(event) {
    ecUI.showLoading('connecting')
    ecBLE.onBLEConnectionStateChange(res => {
      ecUI.hideLoading()
      if(res.ok) {
        wx.switchTab({
          url: '../device/device'
        })
      }
      else {
        ecUI.showModal(
          'tip',
          'connect fail,errcode=' + res.errCode + '.errMsg=' + res.errMsg
        )
      }
    })
    const device = event.currentTarget.dataset.name
    ecBLE.createBLEConnection(device.id)
  },
  openBluetoothAdapter() {
    ecBLE.onBluetoothAdapterStateChange(res => {
      if (res.ok) {
        console.log('ble adapter ok')
        ctx.startBluetoothDevicesDiscovery()
      }
      else {
        ecUI.showModal(
          '提示',
          `Bluetooth adapter error | ${res.errCode} | ${res.errMsg}`,
          () => {
              if (res.errCode === 30001) {
                  wx.openSystemBluetoothSetting()
              }
              if (res.errCode === 30003) {
                  wx.openAppAuthorizeSetting()
              }
              if (res.errCode === 30004) {
                  //跳转到小程序设置界面
                  wx.openSetting()
              }
          }
      )
      }
    })
    ecBLE.openBluetoothAdapter()
  },
  startBluetoothDevicesDiscovery() {
    console.log('start search')
    ecBLE.onBluetoothDeviceFound(res => {
      for (const item of ctx.data.deviceListData) {
        if (item.id == res.id) {
          item.name = res.name
          // item.rssi = res.rssi
          return
        }
      }
      // let manufacturer = ''
      // if (res.name.length === 11 && res.name.startsWith('@')) {
      //     manufacturer = 'eciot'
      // }
      // if (res.name.length === 15 && res.name.startsWith('BT_')) {
      //     manufacturer = 'eciot'
      // }
      ctx.data.deviceListData.push({
          id: res.id,
          name: res.name,
          // rssi: res.rssi,
          // manufacturer,
      })
    })
    ecBLE.startBluetoothDevicesDiscovery()
  }
});
