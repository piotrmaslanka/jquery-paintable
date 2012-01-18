/**
 * Paintable jQuery plugin
 * Make an HTML canvas paintable
 *
 * @param options
 * { }
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
                    window.location.href = this.toDataURL();
                });
            },

            setColor: function(color) {
                return this.each(function() {
                    $(this).data('currentColor', color);
                    this.getContext("2d").fillStyle = this.getContext("2d").strokeStyle = color;
                });
            },

            setTool: function(tool) {
                return this.each(function() {
                    var ctx = this.getContext("2d");
                    switch (tool) {
                        case "pencil":
                            $(this).css('cursor', 'url(pencil.png) 0 16, crosshair');
                            ctx.strokeStyle = $(this).data('currentColor');
                            ctx.lineWidth = 1.5;
                            ctx.lineCap = "butt";
                            break;

                        case "eraser":
                            $(this).css('cursor', 'url(eraserCursor.png) 8 8, crosshair');
                            ctx.fillStyle = "white";
                            ctx.strokeStyle = "white";
                            ctx.lineWidth = 16;
                            ctx.lineCap = "round";
                            break;

                        case "floodFill":
                            $(this).css('cursor', 'url(floodFill.png) 14 11, crosshair');
                            ctx.fillStyle = $(this).data('currentColor');
                            break;

                        case "stamp":
                            $(this).css('cursor', 'url(lilypad.png) 64 44, crosshair');
                            break;
                    }

                    $(this).data('currentTool', tool);
                });
            },

            init: function() {
                var _ = {
                    self: null,
                    dragging: false,
                    oldCoords: {x: 0, y: 0}, // The mouse's previous coords

                    mousedown: function(e) {
                        _.dragging = true;
                        var currentX = e.pageX - $(_.self).offset().left;
                        var currentY = e.pageY - $(_.self).offset().top;

                        switch ($(_.self).data('currentTool')) {
                            case "pencil":
                                _.ctx.fillRect(currentX - 1, currentY - 1, 2, 2);
                                break;

                            case "eraser":
                                _.ctx.beginPath();
                                _.ctx.arc(currentX, currentY, 8, 0, Math.PI * 2, false);
                                _.ctx.fill();
                                break;

                            case "floodFill":
                                var imageData = _.ctx.getImageData(0, 0, _.self.width, _.self.height),
                                    index = Math.round(currentX) * 4 + Math.round(currentY) * 4 * _.self.width,
                                    pix = imageData.data,
                                    oldR = pix[index],
                                    oldG = pix[index + 1],
                                    oldB = pix[index + 2];
                                var newR, newG, newB;

                                var colors = _.ctx.fillStyle;
                                // Safari, Chrome - colors is in form rgb(x, x, x)
                                if (colors.length > 7) {
                                    var colors = colors.substring(4).split(", ");
                                    newR = parseInt(colors[0]);
                                    newG = parseInt(colors[1]);
                                    newB = parseInt(colors[2]);
                                }
                                // Firefox - colors is in form #xxxxxx
                                else {
                                    newR = parseInt(colors.substring(1, 3), 16);
                                    newG = parseInt(colors.substring(3, 5), 16);
                                    newB = parseInt(colors.substring(5, 7), 16);
                                }
                                _.floodFill(pix, index, oldR, oldG, oldB, newR, newG, newB);

                                _.ctx.putImageData(imageData, 0, 0);
                                break;

                            case "stamp":
                                _.ctx.drawImage(stamp, currentX - 64, currentY - 44);
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

                    /**
                     * Floodfill the canvas starting at the clicked pixel. Fills in each neighboring pixel that has a color within the MAX_COLOR_DIFFERENCE.
                     * pix - the 1-D array containing every pixel (pix.length = _.self.width * _.self.height * 4)
                     * index - int containing the index of the current pixel in the 1-D array
                     * oldR, oldG, oldB - ints containing the components of the old color to be replaced
                     * newR, newG, newB - ints containing the components of the new color to be filled in
                     */
                    floodFill: function(pix, index, oldR, oldG, oldB, newR, newG, newB) {
                        var isMatchingColor = function(r1, g1, b1, r2, g2, b2) {
                            var MAX_COLOR_DIFFERENCE = 90;
                            return Math.abs(r1 - r2) < MAX_COLOR_DIFFERENCE &&
                                   Math.abs(g1 - g2) < MAX_COLOR_DIFFERENCE &&
                                   Math.abs(b1 - b2) < MAX_COLOR_DIFFERENCE;
                        };

                        if (isMatchingColor(pix[index], pix[i + 1], pix[i + 2], oldR, oldG, oldB)) {
                            return;
                        }
                        var queue = [index];

                        while (queue.length > 0) {
                            var i = queue.shift();
                            if (isMatchingColor(pix[i], pix[i + 1], pix[i + 2], oldR, oldG, oldB)) {
                                var w = i;
                                var e = i + 4;
                                while (w % (_.self.width * 4) != (_.self.width * 4 - 4) &&
                                       isMatchingColor(pix[w], pix[w + 1], pix[w + 2], oldR, oldG, oldB)) {
                                    w -= 4;
                                }
                                while (e % (_.self.width * 4) != 0 &&
                                       isMatchingColor(pix[e], pix[e + 1], pix[e + 2], oldR, oldG, oldB)) {
                                    e += 4;
                                }
                                for (var j = w + 4; j < e; j += 4) {
                                    pix[j] = newR;
                                    pix[j + 1] = newG;
                                    pix[j + 2] = newB;

                                    if (j >= _.self.width * 4 &&
                                            isMatchingColor(pix[j - _.self.width * 4], pix[j - _.self.width * 4 + 1], pix[j - _.self.width * 4 + 2], oldR, oldG, oldB)) {
                                        queue.push(j - _.self.width * 4);
                                    }
                                    if (j < _.self.height * _.self.width * 4 - _.self.width * 4 &&
                                            isMatchingColor(pix[j + _.self.width * 4], pix[j + _.self.width * 4 + 1], pix[j + _.self.width * 4 + 2], oldR, oldG, oldB)) {
                                        queue.push(j + _.self.width * 4);
                                    }
                                }
                            }
                        }
                    }
                };
            
                return this.each(function() {
                    //if (!$("canvas").getContext) return; // Browser does not support Canvas
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