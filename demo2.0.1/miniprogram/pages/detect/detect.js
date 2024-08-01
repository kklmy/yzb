const ecUI = require('../../utils/ecUI.js')
const ecBLE = require('../../utils/ecBLE.js')
import * as echarts from '../components/ec-canvas/echarts';

let ctx
let c2_standard = 20.0 // 设定一个初始的 c2 标准值

Page({
  data: {
    textRevData: '',
    scrollIntoView: 'scroll-view-bottom',
    dataBuffer: [], // 用于存储10组数据
    postureType: '',
    postureImage: '',
    postureMessage: '',
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
    }
  },

  onLoad: function () {
    ctx = this
    ecBLE.setChineseType(ecBLE.ECBLEChineseTypeGBK)

    ecBLE.onBLEConnectionStateChange(() => {
      ecUI.showModal('提示', '设备断开连接')
    })

    // 接收数据
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

          // 将结果显示到 textRevData 中
          let data = `c0=${averages.c0.toFixed(2)}, c1=${averages.c1.toFixed(2)}, c2=${averages.c2.toFixed(2)}, c3=${averages.c3.toFixed(2)}\r\n`
          data += `坐姿检测结果: ${output}\r\n`
          ctx.setData({ textRevData: data })

          // 更新页面数据
          const postureCounts = ctx.data.postureCounts
          postureCounts[output] = (postureCounts[output] || 0) + 1

          let message = ''
          switch (output) {
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
            postureType: output,
            postureImage: ctx.getPostureImage(output),
            postureMessage: message,
            postureCounts
          })

          ctx.updateChart()
        }
      }
    })

    this.echartsComponent = this.selectComponent('#mychart-dom-pie')
  },

  onUnload() {
    ecBLE.onBLEConnectionStateChange(() => { })
    ecBLE.onBLECharacteristicValueChange(() => { })
    ecBLE.closeBLEConnection()
    if (this.chartUpdateInterval) {
      clearInterval(this.chartUpdateInterval)
    }
  },

  determinePosture({ c0, c1, c2, c3 }) {
    const result = (c0 + c2) / (c3 + c1)
    const third_result = c0 / c1
    const sum_ = c0 + c1 + c2 + c3
    const other = c3 / c2
    const q = c2 / c0

    let output = ''
    if (sum_ < 200) {
      output = '起身'
    } else {
      if (result < 0.7 && (other > 4 || c2 < c2_standard * 0.7)) {
        output = '左倾'
      } else if (0.7 <= result && result <= 1.2 && 1 < third_result && third_result < 2) {
        c2_standard = c2
        output = '标准'
      } else if (result > 1.2) {
        output = '右倾'
      } else {
        if (q < 1) {
          output = '翘左腿'
        } else {
          output = '翘右腿'
        }
      }
    }
    return output
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
    const postureCounts = this.data.postureCounts

    const chartData = Object.keys(postureCounts).map(key => ({
      name: key,
      value: postureCounts[key]
    }))

    chart.setOption({
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
    })
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
        return chart
      })
    }
  }
})
