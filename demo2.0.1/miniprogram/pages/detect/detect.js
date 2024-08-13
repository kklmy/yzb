const ecUI = require('../../utils/ecUI.js')
const ecBLE = require('../../utils/ecBLE.js')
import * as echarts from '../components/ec-canvas/echarts';

let ctx

Page({
  data: {
    textRevData: '',
    scrollIntoView: 'scroll-view-bottom',
    dataBuffer: [], // 用于存储10组数据
    postureType: '标准',
    postureImage: '../../images/standard.jpg',
    postureMessage: '坐得很好，继续保持哦',
    ec: {
      lazyLoad: true
    },
    postureCounts: {
      '起身': 0,
      '左倾': 0,
      '标准': 0,
      '右倾': 0,
      '翘左腿': 0,
      '翘右腿': 0
    },
    recentPostures: [], // 用于存储最近10次姿势判断结果
    postureCounter:0, //计数器，统计坐姿情况 刷新饼图
  },

  onLoad: function () {
    ctx = this
    ecBLE.setChineseType(ecBLE.ECBLEChineseTypeGBK)

    ecBLE.onBLEConnectionStateChange(() => {
      ecUI.showModal('提示', '设备断开连接')
    })

    ecBLE.onBLECharacteristicValueChange((str, strHex) => {
      const match = str.match(/c0:(-?\d+\.\d+), c1:(-?\d+\.\d+), c2:(-?\d+\.\d+), c3:(-?\d+\.\d+)/)
      if (match) {
        const c0 = parseFloat(match[1])
        const c1 = parseFloat(match[2])
        const c2 = parseFloat(match[3])
        const c3 = parseFloat(match[4])

        console.log(`c0=${c0}, c1=${c1}, c2=${c2}, c3=${c3}`)

        // 将数据存储到 dataBuffer 中
        ctx.data.dataBuffer.push({ c0, c1, c2, c3 })

        // 检查是否收集了10组数据
        if (ctx.data.dataBuffer.length === 10) {
          // 计算10组数据的平均值
          const averages = ctx.data.dataBuffer.reduce((acc, cur) => {
            acc.c0 += cur.c0
            acc.c1 += cur.c1
            acc.c2 += cur.c2
            acc.c3 += cur.c3
            return acc
          }, { c0: 0, c1: 0, c2: 0, c3: 0 })

          averages.c0 /= 10
          averages.c1 /= 10
          averages.c2 /= 10
          averages.c3 /= 10

          // 调用函数判断坐姿并输出结果
          const output = ctx.determinePosture(averages)
          console.log(output)

          // 清空 dataBuffer
          ctx.setData({ dataBuffer: [] })

          // 将结果存储到 recentPostures 中
          const recentPostures = ctx.data.recentPostures
          recentPostures.push(output)
          if (recentPostures.length > 10) {
            recentPostures.shift()
          }
          // 更新坐姿统计计数器
          let postureCounter = ctx.data.postureCounter + 1;
          ctx.setData({ postureCounter });
          // 统计最近10次姿势判断结果的出现次数
          const postureCounts = recentPostures.reduce((acc, posture) => {
            acc[posture] = (acc[posture] || 0) + 1
            return acc
          }, {})

          // 找到出现次数最多的姿势
          let maxCount = 0
          let maxPosture = ctx.data.postureType
          for (const posture in postureCounts) {
            if (postureCounts[posture] > maxCount) {
              maxCount = postureCounts[posture]
              maxPosture = posture
            }
          }

          // 更新当前坐姿
          ctx.setData({ postureType: maxPosture })

          // 更新页面数据
          const postureDataCounts = ctx.data.postureCounts
          postureDataCounts[maxPosture] = (postureDataCounts[maxPosture] || 0) + 1

          let message = ''
          switch (maxPosture) {
            case '起身':
              message = '可以入座啦~'
              break
            case '左倾':
              message = '当前坐姿是左倾，请注意纠正错误坐姿哦'
              break
            case '标准':
              message = '坐得很好，继续保持哦'
              break
            case '右倾':
              message = '当前坐姿是右倾，请注意纠正错误坐姿哦'
              break
            case '翘左腿':
              message = '当前坐姿是翘左腿，请注意纠正错误坐姿哦'
              break
            case '翘右腿':
              message = '当前坐姿是翘右腿，请注意纠正错误坐姿哦'
              break
            default:
              message = ''
          }
          ctx.setData({
            postureImage: ctx.getPostureImage(maxPosture),
            postureMessage: message,
            postureCounts: postureDataCounts
          })

          // 每统计20次坐姿后，绘制一次饼图
          if (ctx.data.postureCounter === 8) {
            ctx.updateChart();
            ctx.setData({ postureCounter: 0 }); // 重置计数器
          }
        }
      }
    });

    this.echartsComponent = this.selectComponent('#mychart-dom-pie')
  },

  onUnload() {
    ecBLE.onBLEConnectionStateChange(() => { })
    ecBLE.onBLECharacteristicValueChange(() => { })
    ecBLE.closeBLEConnection()
    if (this.chartUpdateInterval) {
      clearInterval(this.chartUpdateInterval)
    }
    if (this.chartClearTimeout) {
      clearTimeout(this.chartClearTimeout)
    }
  },

  determinePosture({ c0, c1, c2, c3 }) {
    const result = (c0 + c2) / (c3 + c1);
    const sum_ = c0 + c1 + c2 + c3;
    let output = '';
    if (sum_ < 150) {
      output = '起身';
    } else {
      if (Math.abs(c0 - 35) < 5) {
        // 翘右腿
        output = '翘右腿';
      } else if (Math.abs(c1 - 32) < 5) {
        output = '翘左腿';
      } else {
        if (result < 0.8) {
          output = '左倾';
        } else if (0.8 <= result && result <= 1.3) {
          output = '标准';
        } else if (result > 1.3) {
          output = '右倾';
        }
      }
    }
  
    // 如果不是标准坐姿或者不是起身，则开始计时
    if (output !== '标准' && output !== '起身') {
      // 设置1秒后的震动
      setTimeout(() => {
        // 再次确认用户依然处于非标准姿势
        if (output === this.data.postureType) {
          wx.vibrateLong(); // 手机震动1秒
        }
      }, 1000); // 1秒后震动
    }
  
    return output;
  },
  

  getPostureImage: function (postureType) {
    switch (postureType) {
      case '起身':
        return '../../images/stand.png'
      case '左倾':
        return '../../images/left.png'
      case '标准':
        return '../../images/standard.jpg'
      case '右倾':
        return '../../images/right.png'
      case '翘左腿':
        return '../../images/left_leg.png'
      case '翘右腿':
        return '../../images/right_leg.png'
      default:
        return ''
    }
  },

  setPieChartOptions: function (chart) {
    const postureCounts = this.data.postureCounts;
    const chartData = Object.keys(postureCounts).map(key => ({
      name: key,
      value: postureCounts[key]
    }));
  
    chart.setOption({
      animation: true, // 禁用动画效果
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      series: [
        {
          name: '坐姿分布',
          type: 'pie',
          radius: '50%',
          data: chartData,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    });
  },
  
  updateChart: function () {
    if (this.echartsComponent) {
      this.echartsComponent.init((canvas, width, height, dpr) => {
        const chart = echarts.init(canvas, null, {
          width: width,
          height: height,
          devicePixelRatio: dpr
        })
        canvas.setChart(chart)
        this.setPieChartOptions(chart)
      })
    }
  }
})
