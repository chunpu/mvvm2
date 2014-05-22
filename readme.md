Simple MVVM
===

A really simple mvvm framework

here is the demo

- fucking simple [TodoMVC](http://chunpu.github.io/mvvm2/demo/todomvc/)

- fucking simple [Calendar](http://chunpu.github.io/mvvm2/demo/calendar/)

[tiny demo](http://codepen.io/ftft1885/pen/slfhF)

### Usage (too old, see the demo)

```html
<div id='demo1' class='demo'>
  Hello <span class='{{css}}' data-text='xx'>{{name}}</span>!
  <br>
  <p>now is {{time}}</p>
</div>
<script>
var demo1 = mvvm('#demo1', {
  model: {
    name: 'Monkey',
    time: Date(),
    css: 'green'
  }
})
setInterval(function() {
  demo1.model.time = Date()
}, 1000)
</script>
```

```html
<div id='demo2' class='demo'>
  <label><span>name:</span>
    <input name='name'>
  </label>
  <br>
  <label><span>password:</span>
    <input name='password'>
  </label>
  <pre>{
  name: {{name}},
  passowrd: {{password}}
}</pre>
<script>
mvvm('#demo2', {
  type: 'form',
  model: {
    name: '',
    password: ''
  }
})
</script>
```
