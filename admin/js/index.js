new Vue({
  el: '#app',
  data: {
    list: []
  },
  methods: {
    switchMockData: function (mock, option) {
      if (mock.responseKey === option.name) return
      $.ajax({
        url: './update',
        data: {
          apiName: mock.name,
          responseKey: option.name
        },
        dataType: 'json',
        success: function (data) {
          mock.responseKey = option.name
        }
      })
    }
  },
  mounted: function () {
    var self = this
    $.ajax({
      url: './list',
      dataType: 'json',
      success: function (data) {
        self.list = data.data
      }
    })
  }
})
