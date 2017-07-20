(function () {
  var template = $('#template').text()

  $.ajax({
    url: '/chameleon-mock/admin/list',
    dataType: 'json',
    success: function (data) {
      var html = ejs.render(template, { list: data.data })
      $('body').append(html)
    }
  })

  $('body').on('click', '.fetch-btn', function () {
    var url = $(this).data('url')
    var mockName = $(this).data('mockname')
    var optionKey = $(this).data('key')
    var id = $(this).data('id')
    $.ajax({
      url: '/chameleon-mock/admin/update',
      data: {
        mockName: mockName,
        responseKey: optionKey
      },
      dataType: 'json',
      success: function (data) {
        $.ajax({
          url: url,
          dataType: 'json',
          success: function (data) {
            var self = $(`#${id}`)
            var node = new PrettyJSON.view.Node({
              el: self,
              data: data
            })
            node.expandAll()
            self.addClass('on')
          }
        })
      }
    })
  })

  $('pre').each(function () {
    var self = $(this)
    var text = self.text()
    var firstLineSpaces = text.match(/^ +/)[0]
    text = text.replace(/^ +/gm, function (whole) {
      return whole.replace(firstLineSpaces, '')
    })
    self.text($.trim(text))
  })
})()

