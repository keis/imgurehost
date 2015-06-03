var glob = require('glob')
  , imgur = require('imgur')
  , each = require('async-each')
  , fs =require('fs')

function findImages(data) {
  var images = []
    , p = /<img .* src="([^"]*)"/g
    , r

  while ((r = p.exec(data))) {
    images.push(r[1])
  }
  return images
}

function processFile(file, callback) {
  fs.readFile(file, 'utf-8', function (err, data) {
    if (err) {
      return callback(err)
    }

    var urls = findImages(data).filter(function (url) { return !/imgur.com/.exec(url) })
      , urlMap = []

    each(urls, function (url, callback) {
      imgur.uploadUrl(url).then(function (r) {
        urlMap.push([url, r.data.link])
        callback()
      }).catch(function (err) {
        callback(err)
      })
    }, function (err) {
      if (err) {
        return callback(err)
      }
      urlMap.forEach(function (r) {
        data = data.replace(r[0], r[1])
      })
      fs.writeFile(file, data, 'utf-8', callback)
    })
  })
}

function process(path, callback) {
  glob(path + '/**/*.yml', function (err, files) {
    if (err) {
      return callback(err)
    }
    each(files, processFile, callback)
  })
}

function main() {
  var cli = require('meow')()
  process(cli.input[0], function (err) {
    if (err) {
      console.error(err)
    }
  })
}

main()
