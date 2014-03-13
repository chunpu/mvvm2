!function(f) {
  if (window.define && define.amd) define(f)
  else window.mvvm = f()
}(function() {
/*
 * todo:
 * 1: fix trim {{ val }}
 */
var start = '{{'
var end = '}}'

function mvvm(sel, model, opt) {
  return new MVVM(sel, model, opt)
}

function MVVM(sel, model, opt) {
  this.root = sel.nodeType === 1 ? sel : document.querySelector(sel) // root element
  model = this.pureModel = model || {}
  opt = opt || {}
  var model2sync = {} // save nodes, it's fucking complex, we fuck it later
  var nodes = []
  this.model = getProxyModel(model)
  var me = this
  for (var k in model) {
    model2sync[k] = []
  }
  renderDOM(this.root, opt.model)

  if (opt.type === 'form') {
    on(this.root, ['keyup', 'click'], function(e) {
      var name = e.target.name
      if (name) {
        if (e.target.value != model[name]) {
          me.model[name] = e.target.value
        }
      }
    })
  }

  function getProxyModel(model) {
    var obj = {}
    each(Object.keys(model), function(i, k) {
      if (typeof model[k] === 'object') {
        // recursive the obj value
        return obj[k] = getProxyModel(model[k])
      }
      Object.defineProperty(obj, k, {
        set: function(v) {
          model[k] = v
          each(nodes, function() {
            this.node.textContent = renderStr(this.raw)
          })
          /*
          var arr = model2sync[k]
          each(arr, function() {
            this.node.textContent = renderStr(this.raw)
          })
          */
        },
        get: function() {
          return model[k]
        }
      })
    })

    return obj

    // inline function use the current model
    function _set(obj, k) {
      // simple get and set related to model
      Object.defineProperty(obj, k, {
        set: function(v) {
          model[k] = v
          // here need to bind the nodes, but I donnot know how to
          
        },
        get: function() {
          return model[k]
        },
        configurable: true // can be redefine
      })
    }
  }

  function renderDOM(dom) {
    //if (dom.hasAttrubute)
    // walk the node
    each(dom.attributes, function() {
      render(this)
    })
    each(dom.childNodes, function() {
      if (this.nodeType === 1) {
        return renderDOM(this)
      }
      render(this)
    })
  }

  function renderStr(str) {
    var ret = ''
    var arr = str.split(start) // sure have length
    for (var i = 0; i < arr.length; i++) {
      var two = arr[i].split(end)
      if (two.length === 1) ret += arr[i]
      //else ret += model[two[0]] + two[1]
      else ret += getValFromModel(two[0]) + two[1]
    }
    return ret
  }

  function render(node) {
    var arr = node.textContent.split(start)
    if (!arr.length) return
    var ret = ''
    for (var i = 0; i < arr.length; i++) {
      var two = arr[i].split(end)
      if (two.length === 1) ret += arr[i]
      else {
        //ret += model[two[0]] + two[1]
        ret += getValFromModel(two[0]) + two[1]
        nodes.push({
          node: node,
          raw: node.textContent,
          key: two[0]
        })
        /*
        model2sync[two[0]].push({
          node: node,
          raw: node.textContent
        })
        */
      }
    }
    node.textContent = ret
  }

  function getValFromModel(str) {
    // get value from top model
    return _getVal(str.split('.'), model)
  }

  function _getVal(arr, model) {
    // get val from current model
    var ret = model[arr.shift()]
    if (ret === undefined) return 'undefined'
    if (typeof ret === 'object') return _getVal(arr, ret)
    return ret
  }

  // end inline function
}


function on(el, events, handler) {
  if (Array.isArray(events)) {
    each(events, function() {
      on(el, this, handler)
    })
  }
  else el.addEventListener(events, handler, true)
}

function each(arr, fn) {
  for (var i = 0; i < arr.length; i++) {
    fn.call(arr[i], i, arr[i])
  }
}
return mvvm

})
