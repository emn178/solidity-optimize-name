(function ($) {
  var CHARS = '0123456789abcdefghijklmnopqrstuvwxysABCDEFGHIJKLMNOPQRSTUVWXYS$_'.split('');
  var CHAR_MAP = {};
  CHARS.forEach(function (c, index) {
    CHAR_MAP[c] = index;
  });

  var CHAR_CODES = CHARS.map(function (c) {
    return c.charCodeAt(0);
  });

  var CHAR_CODE_MAP = {};
  CHARS.forEach(function (c, index) {
    CHAR_CODE_MAP[index] = c.charCodeAt(0);
  });

  var data = { blocks: [], s: [] };
  function save(hash) {
    data.reset = hash.reset;
    data.block = hash.block;
    data.start = hash.start;
    data.finalized = hash.finalized;
    data.lastByteIndex = hash.lastByteIndex;
    for (var i = 0; i < hash.blocks.length; ++i) {
      data.blocks[i] = hash.blocks[i];
    }
    for (var i = 0; i < hash.s.length; ++i) {
      data.s[i] = hash.s[i];
    }
  }

  function restore(hash) {
    hash.reset = data.reset;
    hash.block = data.block;
    hash.start = data.start;
    hash.finalized = data.finalized;
    hash.lastByteIndex = data.lastByteIndex;
    for (var i = 0; i < data.blocks.length; ++i) {
      hash.blocks[i] = data.blocks[i];
    }
    for (var i = 0; i < data.s.length; ++i) {
      hash.s[i] = data.s[i];
    }
  }

  function toBytes(str) {
    var bytes = [];
    for (var i = 0; i < str.length; ++i) {
      bytes.push(str.charCodeAt(i));
    }
    return bytes;
  }

  function parseSignature(signature) {
    if (signature.charAt(signature.length - 1) != ')' || signature.indexOf(' ') !== -1) {
      return false;
    }
    var parts = signature.split('(');
    if (parts.length == 2) {
      return {
        name: parts[0],
        args: '(' + parts[1]
      };
    } else {
      return false;
    }
  }

  function increase(bytes) {
    bytes[0] += 1;
    for (var i = 0; i < bytes.length; ++i) {
      if (bytes[i] === 64) {
        bytes[i] = 0;
        if (i == bytes.length - 1) {
          bytes[i + 1] = 1;
        } else {
          bytes[i + 1] += 1;
        }
      } else {
        break;
      }
    }
    return bytes;
  }

  function toChars(bytes) {
    var str = '';
    for (var i = 0; i < bytes.length; ++i) {
      str += CHARS[bytes[i]];
    }
    return str;
  }

  function toCharCodes(bytes) {
    var codes = [];
    for (var i = 0; i < bytes.length; ++i) {
      codes.push(CHAR_CODE_MAP[bytes[i]]);
    }
    return codes;
  }

  function find(obj) {
    var sig = obj.name + obj.args;
    var args = toBytes(obj.args);
    var bytes = [0];
    var index = 0;
    var prefix = toBytes(obj.name + '_');
    var hash = keccak256.create();
    hash.update(prefix);
    save(hash);
    var char, methodId = keccak256.array(sig);
    while (methodId[0] || methodId[1]) {
      if (index >= CHARS.length) {
        increase(bytes);
        hash = keccak256.create();
        hash.update(prefix);
        hash.update(toCharCodes(bytes));
        save(hash);
        index = 0;
      }
      char = CHARS[index];
      hash.update(char);
      hash.update(args);
      methodId = hash.array();
      restore(hash);
      ++index;
    }
    if (index) {
      sig = obj.name + '_' + toChars(bytes) + char + obj.args;
    }
    return [sig, keccak256(sig).substr(0, 8)];
  }

  $(document).ready(function () {
    $('#optimize').click(function () {
      var input = $('#input').val();
      $('#error').hide();;
      var data = parseSignature(input);
      if (!data) {
        $('#error').show();;
        return;
      }
      console.time('a');
      var result = find(data);
      console.timeEnd('a')
      $('#output').append('<p>' + result[0] + ': 0x' + result[1] + '</p>')
    });
  });
})(jQuery);
