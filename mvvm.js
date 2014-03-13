function mvvm(model, opt) {
  return new MVVM(model, opt)
}

function MVVM(model, opt) {
  var self = this
  this.model = model
  var nodes = document.querySelectorAll('[data-text]')
  var nodes2sync = []
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].dataset.repeat) this.observeArray(nodes[i])
    else {
      nodes2sync.push({
        node: nodes[i],
        raw: nodes[i].dataset.text
      })
    }
  }
  updateAll()

  Object.observe(model, function(changes) {
    for (var i = 0; i < changes.length; i++) {
      if (changes[i].type === 'update')
        return updateAll()
    }
  })

  function updateAll() {
    nodes2sync.forEach(function(x, i) {
      with (self.model) {
        console.log(x)
        x.node.textContent = eval(x.raw)
      }
    })
  }
}

MVVM.prototype.observePlain = function(node, flag) {
  // it's shit
  if (flag === undefined) {
    var text = node.dataset.text
    delete node.dataset.text
  }
  with (this.model) {
    // TODO not only textContent
    node.textContent = eval(text)
  }
}

MVVM.prototype.observeArray = function(node) {
  var self = this
  var repeat = node.dataset.repeat
  var text = node.dataset.text
  var list = this.model[repeat]

  // remove dataset
  delete node.dataset.repeat
  delete node.dataset.text
  var ref = document.createComment('repeat ' + repeat)
  insertAfter(ref, node)
  node.remove()

  init()

  function renderList(i) {
    with (self.model) {
      return eval(text)
    }
  }

  function init() {
    for (var i = list.length - 1; i >= 0; i--) {
      var clone = node.cloneNode()
      var x = clone.textContent = renderList(i)
      console.log(x)
      insertAfter(clone, ref)
    }
  }

  Object.observe(list, function(changes) {
    changes.forEach(function(change) {
      switch (change.type) {
        case 'update':
          if (change.name > -1) {
            // fuck length
            // don't fuck node
            offset(ref, change.name).textContent = renderList(change.name)
          }
        break
        case 'add':
          var lastNode = offset(ref, change.name - 1)
          var clone = node.cloneNode()
          clone.textContent = renderList(change.name)
          insertAfter(clone, lastNode)
        break
        case 'delete':
          offset(ref, change.name).remove()
      }
    })
  })

}

function offset(ref, x) {
  var node = ref.nextSibling
  while (x--) {
    node = node.nextSibling
  }
  return node
}

function insertAfter(node, ref) {
  ref.parentNode.insertBefore(node, ref.nextSibling)
}
