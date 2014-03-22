!function() {
  // fucking simple, it works just when I finish
  if (Object.observe) return Object.observe.check = function() {/* es7 */}
  Object.observe = observe
  var arr = []
  function observe(obj, cb) {
    var clone = {}
    for (var k in obj) {
      clone[k] = obj[k]
    }
    arr.push([obj, clone, cb])
  }
  observe.check = check
  function check() {
    for (var i = 0; i < arr.length; i++) {
      var changes = []
      , obj = arr[i][0]
      , clone = arr[i][1]
      , cb = arr[i][2]

      for (var k in obj) {
        if (k in clone) {
          if (clone[k] !== obj[k]) {
            // update
            changes.push({
              name: k,
              type: 'update',
              oldValue: clone[k]
            })
            clone[k] = obj[k]
          }
        } else {
          // not in clone, it's add
          changes.push({
            name: k,
            type: 'add'
          })
          clone[k] = obj[k]
        }
      }
      for (var k in clone) {
        if (!(k in obj)) {
          // delete
          changes.push({
            name: k,
            type: 'delete',
            oldValue: clone[k]
          })
          delete clone[k]
        }
      }

      if (changes.length !== 0) {
        for (var i = 0; i < changes.length; i++) {
          changes[i].object = obj
        }
        cb(changes)
      }
    }
    setTimeout(_check, 10) // no care about the order by fuck speed
  }
  function _check() {
    // inside check
    check() // todo
  }
}()


!function() {

var start = '{{'
var end = '}}'

var data = window.data = {} // debug
data.set = function(obj) {
  var expando
  do {
    expando = Math.random() + ''
  } while (data[expando])
  data[expando] = obj
  return expando
}

// context may change to data-scope
// all show as nested scope
function mvvm(model, opt) {
  // model is the object, context is the root element
  bindModel(document.body, model)

  // will be into the mvvm function
  // simple tool function 
  mvvm.getOffset = function(list, node) {
    var ref = data[list.$ref]
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


  function bindModel(node, model, parentModel) {
    // 这里所有的问题在于, model应该extend parentModel
    // 就如js那样, 子scope包含父scope
    var nodes2sync = [] // 一个observe对应一个nodes2sync
    // this two will change to define
    model.$el = data.set(node)
    if (parentModel) {
      //extend(model, parentModel) // this will total screw the model
      model.$parent = data.set(parentModel) // save parent
      filter.call(model, data[model.$parent])
    }
    walk(node, model)

    Object.observe(model, function(changes) {
      // 难点: 如何告知父model我变了
      // 由于collect中的子model有i, 和他代表的el
      // 事实上, 解决这个问题, 那`getOffset`的问题也解决了
      // 有一个暂时的办法就是每个model, 在observe前都有一个expando
      // 然后把parent存在model中
      // Angular也有parent嘛..
      // 区别是我污染了model, 因为我没有scope的概念, 直接放model里了
      //console.log(nodes2sync, changes)
      each(changes, function() {
        var change = this
        each(nodes2sync, function() {
          if (this.raw) {
            var ret = renderStr(this.raw, model)
            if (this.node.nodeType === 2) {
              return this.owner.setAttribute(this.node.name, ret)
            }
            this.node.textContent = ret
          } else {
            // it's data-bind
            // how could change find the parent nodes2sync????
            console.log(change, this)
            if (change.name === this.name) {
              opt[this.cb] && opt[this.cb].call(this, change)
            }
          }
        })
      })
      // trigger parent model if has filter
      /*
      var $parent = data[model.$parent]
      if ($parent.filter) {
        filter.call(model, $parent.filter)
      }*/
      if (model.$parent) filter.call(model, data[model.$parent])
      opt.onupdate && opt.onupdate()
    })

    function walk(node, model) {
      // find the data-repeat dom, send to bindList
      // find the {{}} node, send to bindObj
      if (node.dataset.repeat) return bindList(node, model[node.dataset.repeat], model)
      each(node.childNodes, function() {
        if (this.nodeType === 1) {
          return walk(this, model) // nested and no scope walk don't observe
        }
        bindAtom(this, model, node)
      })

      each(node.attributes, function() {
        if (this.name === 'data-bind') {
          // bind
          bindComplex(this, model, node)
        } else if (this.name === 'data-on') {
          bindEvent(this, model, node)
        } else {
          bindAtom(this, model, node)
        }
      })
    }

    function bindEvent(node, model, owner) {
      // data-on="click: trigger"
      var two = node.textContent.split(':')
      var type = two[0].trim()
      on(owner, type, opt[two[1].trim()], model)
      delete owner.dataset.on
    }

    function bindComplex(node, model, owner) {
      // same as bindAtom, push node to nodes2sync
      // but it bind to the key directly
      var two = node.textContent.split(':')
      var o = {
        cb: two[1].trim(),
        name: two[0].trim(), // may be hash later
        node: node,
        owner: owner // because if we fuck the attr node, we lose the ownerElement
      }
      nodes2sync.push(o)
      opt[o.cb] && opt[o.cb].call(o, {name: o.name, object: model})
      delete owner.dataset.bind // always delete the data attr
    }

    // fuck, it's just render, never call bind again
    function bindAtom(node, model, owner) {
      // Atom node is attribute node or text node
      if (node === window) {
        return // fuck firefox
      }
      var v = node.nodeType === 2 ? node.value : node.textContent
      var arr = v.split(start)
      if (arr.length < 2) return
      var ret = renderStr(v, model)
      
      if (node.nodeType === 2) owner.setAttribute(node.name, ret)
      else node.textContent = ret
      nodes2sync.push({
        node: node,
        raw: v,
        owner: owner
      })
    }
  }

  function getScope(model) {
    if (!model.$parent) return model
    var scope = {}, $parent = model
    while ($parent) {
      if (!Array.isArray($parent)) extend(scope, $parent) // skip array
      $parent = data[$parent.$parent]
    }
    //console.log(scope)
    return scope
  }

  function renderStr(text, model) {
    var scope = getScope(model)
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
      with (scope) {
        return eval(text)
      }
    }
  }

  function bindList(node, list, parentModel) {
    // list is collections of item, item is node to walk
    if (parentModel) {
      list.$parent = data.set(parentModel)
    }
    var repeat = node.dataset.repeat
    delete node.dataset.repeat
    var ref = document.createComment('repeat ' + repeat)
    insertAfter(ref, node)
    node.parentNode.removeChild(node)
    // init, reverse!!!
    for (var i = list.length - 1; i > -1; i--) {
      var clone = node.cloneNode(true)
      insertAfter(clone, ref)
      // save the $index to the obj
      // if it is not a obj
      bindModel(clone, fixModel(list[i], i), list)
    }
    Object.observe(list, function(changes) {
      // if it is a es7 observe, update won't be all before delete
      // and this will cause update item which is deleted(reappearby double splice)
      // so if it is es7 observe, we delete the same name, and delete should from bigger to smaller
      var map = {}
      for (var l = changes.length, i = l - 1; i > -1; i--) {
        if (map[changes[i].name] === undefined) {
          map[changes[i].name] = true
        } else {
          changes.splice(i, 1)
        }
      }
      // delete reorder
      changes.sort(function(x, y) {
        return x.name - y.name
      })
      each(changes, function(i) {
        var list = this.object
        // filter
        //
        // filter is not easy, because when model changes, it should auto filter
        // however model cannot access to list
        if (this.name === 'filter') {
          // later filter can be a array
          each(list, function() {
            filter.call(this, list)
          })
          return
        }
        var i = +this.name
        if (i > -1) {
          if (this.type === 'update') {
            //bindModel(offset(ref, i-1), fixModel(list[i], i))
            var el = offset(ref, i)
            // 终极难点
            // 因为model整个被干了, 我们没办法取得之前的model来进行逐个赋值
            // 先delete后add, 子view全刷新，唉，我没办法了
            var clone = node.cloneNode(true)
            bindModel(clone, fixModel(list[i], i), list)
            insertAfter(clone, el)
            el.parentNode.removeChild(el)
          } else if (this.type === 'add') {
            var lastNode = offset(ref, i - 1)
            var clone = node.cloneNode(true)
            bindModel(clone, fixModel(list[i], i), list)
            insertAfter(clone, lastNode, list)
          } else if (this.type === 'delete') {
            var el = offset(ref, i)
            el.parentNode.removeChild(el)
            // need unobserve?
          }
        }
      })
      opt.onupdate && opt.onupdate()
    })
    list.$ref = data.set(ref)
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
  // why reverse? it's important because collection add it's clone to node first
  for (var l = arr.length, i = l - 1; i >= 0; i--) {
    cb.call(arr[i], i, arr[i])
  }
}

function handler(ev) {
  var node = ev.target
  if (node.expando) {
    var evObj = data[node.expando]
    if (evObj) {
      var handlers = evObj[ev.type]
      if (handlers) {
        for (var i = 0, l = handlers.length; i < l; i++) {
          handlers[i].call(evObj.model, ev)
        }
        Object.observe.check()
      }
    }
  }

}

function on(node, evType, cb, model) {
  // on(body, click, function)
  // will add ev types later
  // will change to handler same as jquery
  node.addEventListener(evType, handler, false)
  var evObj = {}
  if (node.expando) {
    evObj = data[node.expando]
  }
  evObj.model = evObj.model || model
  evObj[evType] = evObj[evType] || []
  evObj[evType].push(cb)
  if (!node.expando) node.expando = data.set(evObj)
}

function insertAfter(node, ref) {
  ref.parentNode.insertBefore(node, ref.nextSibling)
}


// 0 -> ref下第一个
// 1 -> ref下第二个
// -1 -> 返回自己(lastNode)
function offset(ref, x) {
  x++
  while (x--) {
    ref = ref.nextSibling
  }
  return ref
}

function filter(list) {
  var filters = list.filter
  if (typeof filters === 'function') {
    data[this.$el].hidden = !filters(this)
  }
}

function extend(son, scope) {
  // {a: 1} + {a: 2, b: 3} => {a: 1, b: 3}
  for (var k in scope) {
    if (!(k in son)) {
      son[k] = scope[k]
    }
  }
}

window.mvvm = mvvm

}()
