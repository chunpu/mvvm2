/*
 * 保证递归的要点在于， 递归函数是独立的，参数和作用范围明确， 任何艰苦环境都能运行
 *
 */

var start = '{{'
var end = '}}'

var nodes2save = {}

function saveNode(node) {
  var expando = Math.random() + ''
  nodes2save[expando] = node
  return expando
}

// context may change to data-scope
// all show as nested scope
function mvvm(model, opt) {
  // model is the object, context is the root element
  window.model = model
  bindModel(document.body, model)

  // will be into the mvvm function
  // simple tool function 
  mvvm.getOffset = function(list, node) {
    var ref = nodes2save[list.$ref]
    while (node.parentNode && node.parentNode !== ref.parentNode) {
      node = node.parentNode
    }
    var i = 0
    while (ref.nextSibling && ref.nextSibling !== node) {
      i++
      ref = ref.nextSibling
    }
    return i
  }


  function bindModel(node, model) {
    var nodes2sync = [] // 一个observe对应一个nodes2sync
    walk(node, model)
    model.$el = saveNode(node) // danger
    Object.observe(model, function(changes) {
      each(changes, function() {
        each(nodes2sync, function() {
          var ret = renderStr(this.raw, model)
          if (this.node.nodeType === 2) {
            if (ret === 'false') {
              return this.node.ownerElement.removeAttribute(this.node.name)
            }
            return this.node.ownerElement.setAttribute(this.node.name, ret)
          }
          this.node.textContent = ret
        })
      })
      opt.onupdate && opt.onupdate()
    })

    // walk 和 bindModel是不同的
    // walk 是递归walk, 不能有observe
    function walk(node, model, firstObserve) {
      // find the data-repeat dom, send to bindList
      // find the {{}} node, send to bindObj
      if (node.dataset.repeat) {
        return bindList(node, model[node.dataset.repeat])
      }
      // walk it's childs
      each(node.attributes, function() {
        bindAtom(this, model)
      })
      each(node.childNodes, function() {
        if (this.nodeType === 1) {
          return walk(this, model) // nested and no scope walk don't observe
        }
        bindAtom(this, model)
      })
    }

    // fuck, it's just render, never call bind again
    function bindAtom(node, model) {
      // Atom node is attribute node or text node
      var arr = node.textContent.split(start)
      if (arr.length < 2) return
      nodes2sync.push({
        node: node,
        raw: node.textContent
      })
      var ret = renderStr(node.textContent, model)
      if (node.nodeType === 2) {
        // attribute node
        if (ret === 'false') {
          return node.ownerElement.removeAttribute(node.name)
        }
        return node.ownerElement.setAttribute(node.name, ret)
      }
      node.textContent = ret
    }
  }

  function renderStr(text, model) {
    var arr = text.split(start)
    var ret = ''
    for (var i = 0; i < arr.length; i++) {
      var two = arr[i].split(end)
      if (two.length === 1) ret += arr[i]
      else {
        ret += evalRender(two[0]) + two[1]
      }
    }
    return ret
    function evalRender(text) {
      with (model) {
        return eval(text)
      }
    }
  }

  function bindList(node, list) {
    // list is collections of item, item is node to walk
    var repeat = node.dataset.repeat
    delete node.dataset.repeat
    var ref = document.createComment('repeat ' + repeat)
    list.$ref = saveNode(ref)
    insertAfter(ref, node)
    node.remove()
    // init, reverse!!!
    for (var i = list.length - 1; i > -1; i--) {
      var clone = node.cloneNode(true)
      insertAfter(clone, ref)
      // save the $index to the obj
      // if it is not a obj
      bindModel(clone, fixModel(list[i], i))
    }
    Object.observe(list, function(changes) {
      each(changes, function() {
        var i = +this.name
        if (i > -1) {
          if (this.type === 'update') {
            // what?
            //bindModel(offset(ref, i-1), fixModel(list[i], i))
            var el = offset(ref, i)
            // 终极难点
            // 因为model整个被干了, 我们没办法取得之前的model来进行逐个赋值
            // 先delete后add, 子view全刷新，唉，我没办法了
            var clone = node.cloneNode(true)
            bindModel(clone, fixModel(list[i], i))
            insertAfter(clone, el)
            el.remove()
          } else if (this.type === 'add') {
            var lastNode = offset(ref, i - 1)
            var clone = node.cloneNode(true)
            bindModel(clone, fixModel(list[i], i, node))
            insertAfter(clone, lastNode)
          } else if (this.type === 'delete') {
            offset(ref, i).remove()
            // need unobserve?
          }
        }
      })
      opt.onupdate && opt.onupdate()
    })
  }

  function fixModel(item, i) {
    if (typeof item === 'object') {
      item.i = i
    } else {
      return {
        i: i,
        $value: item
      }
    }
    return item
  }
  // end inline

}


// tool function
function each(arr, cb) {
  for (var i = 0, l = arr.length; i < l; i++) {
    cb.call(arr[i], i, arr[i])
  }
}

function insertAfter(node, ref) {
  ref.parentNode.insertBefore(node, ref.nextSibling)
}

function offset(ref, x) {
  var node = ref.nextSibling
  while (x--) {
    node = node.nextSibling
  }
  return node
}

