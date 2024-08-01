const showModal = (title, content, cb) => {
    wx.showModal({
        title,
        content,
        showCancel: false,
        complete: () => {
            if (cb) cb()
        },
    })
}

const showLoading = title => {
    wx.showToast({
        title,
        icon: 'loading',
        duration: 3600000,
        mask: true,
    })
}

const hideLoading = () => {
    wx.hideLoading()
}

module.exports = {
    showModal,
    showLoading,
    hideLoading
}
