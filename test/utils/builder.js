var fs = require('fs-extra');
var path = require('path');
var structure = fs.readFileSync(
  path.join(__dirname, './structure'),
  'utf-8'
);

var code = structure
  .split('\n')
  .map(function(line) {
    return {
      indent: line.length - line.replace(/^\s+/,'').length,
      type: /\/$/.test(line) ? 'dir': 'file',
      text: line.replace(/^\s+|\s*\/\s*|\s+$/g, '')
    }
  })

function join(arr) {
  return arr.join('/');
}

function transform(arr) {
  var result = [];
  var temp = [];
  var indent = 0;
  arr.forEach(function(line) {
    if (!line.text) {
      return;
    }
    else if (!line.indent) {
      temp.push(line.text);
      result.push({type: line.type, text: join(temp) });
    }

    else if (indent < line.indent) {
      temp.push(line.text);
      result[result.length - 1].type = 'dir';
      result.push({type: line.type, text: join(temp) });
    }

    else if (indent == line.indent) {
      temp.pop();
      temp.push(line.text);
      result.push({type: line.type, text: join(temp) });
    }

    else if(indent > line.indent) {
      temp.pop();
      temp.pop();
      temp.push(line.text)
      result.push({type: line.type, text: join(temp) });
    }

    indent = line.indent;
  });
  return result;
}

var transformed= transform(code);
var defaultTestPath= path.join(__dirname, '__TREE__');

module.exports = function builder() {
  var root = defaultTestPath;
  transformed.forEach(function(line) {
    var target = path.join(root, line.text)
    line.type == 'dir'
      ? fs.ensureDirSync(target)
      : fs.ensureFileSync(target);
  });
  return {
    getPath: function(fpath) {
      return path.join(root, fpath);
    },
    modify: function(fpath, delay) {
      var filePath = this.getPath(fpath);
      setTimeout(function() {
        fs.appendFileSync(filePath, 'hello', 'utf-8');
      }, delay || 0);
    },
    remove: function(fpath, delay) {
      var filePath = this.getPath(fpath);
      setTimeout(function() {
        fs.removeSync(filePath);
      }, delay || 0);
    },
    newFile: function(fpath) {
      fs.ensureFileSync(this.getPath(fpath));
    },
    newSymLink: function(src, dist) {
      fs.ensureSymlinkSync(
        this.getPath(src),
        this.getPath(dist)
      );
    },
    newDir: function(fpath) {
      fs.ensureDirSync(this.getPath(fpath));
    },
    cleanup: function() {
      try {
        fs.removeSync(root);
      } catch (e) {
        console.warn('cleanup failed.');
      }
    }
  }
}
