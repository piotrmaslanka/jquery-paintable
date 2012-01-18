/**
 * jquery-paintable jQuery plugin
 * Make an HTML <canvas> paintable
 *
 * By Golf Sinteppadon
 * https://github.com/MiniGolf2000/jquery-paintable
 */
(function($) {
    $.fn.paintable = function(method) {

        methods = {
            undo: function() {
                return this.each(function() {
                    var undoStack = $(this).data('undoStack');
                    if (undoStack.length > 1) {
                        undoStack.pop();
                        this.getContext("2d").putImageData(undoStack[undoStack.length - 1], 0, 0);
                    }
                });
            },

            save: function() {
                return this.each(function() {
                    window.open(this.toDataURL);
                });
            },

            setColor: function(color) {
                return this.each(function() {
                    $(this).data('currentColor', color);
                });
            },

            setTool: function(tool) {
                return this.each(function() {
                    var ctx = this.getContext("2d");
                    switch (tool) {
                        case "pencil":
                            $(this).css('cursor', 'url(pencil.png) 0 16, crosshair');
                            ctx.lineWidth = 1.5;
                            ctx.lineCap = "butt";
                            break;
                        case "eraser":
                            $(this).css('cursor', 'url(eraserCursor.png) 8 8, crosshair');
                            ctx.lineWidth = 16;
                            ctx.lineCap = "round";
                            break;
                        default:
                            console.warn('Provided tool not found: ' + tool);
                            return;
                    }

                    $(this).data('currentTool', tool);
                });
            },

            init: function() {
                var _ = {
                    self: null,
                    ctx: null,
                    dragging: false,
                    oldCoords: {x: 0, y: 0}, // The mouse's previous coords

                    mousedown: function(e) {
                        _.dragging = true;
                        var currentX = e.pageX - $(_.self).offset().left;
                        var currentY = e.pageY - $(_.self).offset().top;

                        switch ($(_.self).data('currentTool')) {
                            case "pencil":
                                _.ctx.strokeStyle = $(this).data('currentColor');
                                _.ctx.fillRect(currentX - 1, currentY - 1, 2, 2);
                                break;

                            case "eraser":
                                _.ctx.strokeStyle = _.ctx.fillStyle = '#FFFFFF';
                                _.ctx.beginPath();
                                _.ctx.arc(currentX, currentY, 8, 0, Math.PI * 2, false);
                                _.ctx.fill();
                                break;
                        }
                    },

                    mouseup: function() {
                        if (_.dragging) {
                            _.dragging = false;
                            $(_.self).data('undoStack').push(_.ctx.getImageData(0, 0, _.self.width, _.self.height));
                        }
                    },

                    mousemove: function(e) {
                        if ($(_.self).data('currentTool') == "pencil" || $(_.self).data('currentTool') == "eraser") {
                            _.ctx.beginPath();
                            _.ctx.moveTo(_.oldCoords.x, _.oldCoords.y);

                            var currentX = e.pageX - $(_.self).offset().left;
                            var currentY = e.pageY - $(_.self).offset().top;
                            if (_.dragging) {
                                _.ctx.lineTo(currentX, currentY);
                                _.ctx.stroke();
                            }
                            _.oldCoords = {x: currentX, y: currentY};
                        }
                    },
                };

                return this.each(function() {
                    if (!$(this).getContext) {
                        console.error('$(this).getContent not found - element is not a canvas or browser does not support <canvas>');
                        return;
                    }

                    _.self = this;
                    // Setup canvas
                    _.ctx = this.getContext("2d");

                    // Setup listeners
                    $(this).on('mousedown', _.mousedown);
                    $(document).on('mouseup', _.mouseup);
                    $(document).on('mousemove', _.mousemove);

                    // Set defaults
                    _.ctx.fillStyle = "white";
                    _.ctx.fillRect(0, 0, _.self.width, _.self.height);
                    var emptyImageData = _.ctx.getImageData(0, 0, _.self.width, _.self.height);
                    $(this).data('undoStack', [emptyImageData]);
                    $(this).paintable('setColor', '#000000').paintable('setTool', 'pencil');
                });
            }
        };

        // Method calling logic
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if ( typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.paintable');
        }

    };
})(jQuery);