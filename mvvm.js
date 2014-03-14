/*
 * 保证递归的要点在于， 递归函数是独立的，参数和作用范围明确， 任何艰苦环境都能运行
 *
 */

function mvvm(model, context) {
  // model is the object, context is the root element
  window.model = model
  walk(context || document.body, model)
}


var nodes2sync = []
var start = '{{'
var end = '}}'

function walk(node, model) {
  // find the data-repeat dom, send to bindList
  // find the {{}} node, send to bindObj
  if (node.dataset.repeat) {
    return bindList(node, model[node.dataset.repeat])
  }
  // walk it's childs
  each(node.childNodes, function() {
    if (this.nodeType === 1) {
      return walk(this, model)
    }
    bindAtom(this, model)
  })
}

function bindAtom(node, model) {
  // Atom node is attribute node or text node
  var arr = node.textContent.split(start)
  if (arr.length < 2) return
  nodes2sync.push({
    node: node,
    raw: node.textContent
  })
  // render text
  var ret = ''
  for (var i = 0; i < arr.length; i++) {
    var two = arr[i].split(end)
    if (two.length === 1) ret += arr[i]
    else {
      ret += evalRender(two[0]) + two[1]
    }
  }
  node.textContent = ret

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
  insertAfter(ref, node)
  node.remove()
  // init
  each(list, function(i) {
    var clone = node.cloneNode(true)
    insertAfter(clone, ref)
    // save the $index to the obj
    // if it is not a obj
    walk(clone, fixModel(list[i], i))
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


// tool function
function each(arr, cb) {
  for (var i = 0, l = arr.length; i < l; i++) {
    cb.call(arr[i], i, arr[i])
  }
}

function insertAfter(node, ref) {
  ref.parentNode.insertBefore(node, ref.nextSibling)
}
