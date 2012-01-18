jquery-paintable
=========
jquery-paintable is a jQuery plugin that makes any HTML `<canvas>` element paintable

Demo
----
[http://golfsinteppadon.com/paintable/](http://golfsinteppadon.com/paintable/)

Usage
-----

1. Download and include jquery-paintable.js

    `<script src="jquery-paintable.js"></script>`

2. Initialize paintable

    `$('#canvas').paintable();`

Initializing jquery-paintable allows users to draw on the canvas. Changing tools, colors or other things can be done by calling methods.

Methods
-------

**setTool** `.paintable('setTool', toolName)`

> Set the tool to be used. toolName can be "pencil" or "eraser"

**setColor** `.paintable('setColor', color)`

> Set the color to use with the "pencil" tool. color is any valid CSS color string

**save** `.paintable('save')`

> Open a new window showing an image of the canvas

**undo** `.paintable('undo')`

> Undo the last user action