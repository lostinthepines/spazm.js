// Copyright 2012 Bearhanded All Rights Reserved.

/**
 * @fileoverview JQuery viewer with pan/zoom support
 * @author alex@bearhanded.com (Alex Peterson)
 */
(function( $ ){

  var panning = false;
  var zooming = false;
  var oldX = 0;
  var oldY = 0;
  var startAngle = 0;
  var startLevel = 0;
  var startX = 0;
  var startY = 0;
  var panned = false;
  var loadingImage = 0;
  var loadingAngles = false;
  var lastClickTime = 0;
  
  var methods = {

    /**
    * Initialize the plugin
    * @param {object} options The options to initialize the plugin with.
    * Options are:
    * ...
    * @return the modified jquery object
    */
      init : function( options ) {

        return this.each(function(){
          var $this = $(this);
          var data = $this.data('viewer');
          var settings = $.extend( {
            // Required parameters
            'prefix' : null,
            'num_images' : -1,
            'full_width' : -1,
            'full_height' : -1,
            'num_zoom_levels' : -1,
            // Optional parameters
            'zoom_level' : 0,
            'angle_index' : 0,
            'rotate_right' : false,
            'format' : 'jpg',
            'debug' : false,
            // Undocumented (works in progress)
            'resizable' : false,
            // Undocumented (trying to eliminate)
            'tile_width' : 512,
            'tile_height' : 384,
            'num_loaded' : 0,
            'levels' : [],
            'min_width' : $(this).width(),
            'min_height' : $(this).height()
          }, options);
         
          if( !data ) {
            $(this).data('viewer', settings);
            data = $this.data('viewer');

            // Check for required parameters
            var unfound = '';
            if(!data.prefix)
              unfound += 'prefix';
            if(data.num_images < 0)
              unfound += unfound.length > 0 ? ', num_images' : 'num_images';
            if(data.full_width < 0)
              unfound += unfound.length > 0 ? ', full_width' : 'full_width';
            if(data.full_height < 0)
              unfound += unfound.length > 0 ? ', full_height' : 'full_height';
            if(data.num_zoom_levels < 0)
              unfound += unfound.length > 0 ? ', num_zoom_levels' : 'num_zoom_levels';
            if(unfound.length > 0) {
              console.log('SPAZM: Please provide the following parameter(s) and try again: ' + unfound);
              return;
            }

            // save some info about each level size
            data.levels = getLevelSizes(data.num_zoom_levels, data.min_width, data.min_height, data.full_width, data.full_height);

            // load all the top level fully zoomed out images
            var txt = '';
           
            // angles are for panning
            txt += '<div class="angles">';
            txt += '<img class="angle0" src="' + settings.prefix  + '0_0_0_0.' + data.format + '" style="width:' + data.min_width + 'px; height:' + data.min_height + 'px;" />';
            txt += '</div>';
           
            $(this).append(txt);
           
            // next divs are for tiles
            txt = '<div class="visible" style="display:none"></div>';
            txt += '<div class="loading" style="display:none"></div>';
           
            // hotspots are for clicking
            txt += '<div class="hotspots" style="width:' + data.min_width + 'px; height:' + data.min_height + 'px"></div>';
           
            $(this).append(txt);
           
            // fill tile layers with tiles
            var num_tiles = (Math.ceil(data.min_height / data.tile_height) + 1) * (Math.ceil(data.min_width / data.tile_width) + 1);
            for(var t = 0; t < num_tiles; t++) {
              $(this).find('.visible,.loading').append('<img src="" class="recyclable" />');
            }

            // apply necessary styling
            $(this).css('overflow','hidden').css('cursor','move');
            $(this).children().css('position','absolute').css('top','0').css('left','0').css('width','10000px').css('height','10000px');
            $(this).find('img').css('position','absolute');

            // loading bar
            $(this).append('<div class="loader"><div class="bar_empty"><div class="bar"></div></div></div>');

            // load all the angle images
            loadingAngles = true;
            $(this).children('.angles').imagesLoaded(onAngleImageLoaded);

            // mouse events
            $(this).mousedown(function(e) {
              mouse_down(e, $(this), e.pageX, e.pageY);
            });
           
            $(this).mousemove(function(e) {
              mouse_move(e, $(this), e.pageX, e.pageY);
            });

            $(this).mouseup(function(e) {
              mouse_up(e, $(this));
            });
           
            $(this).mousewheel(function(e,delta,deltaX,deltaY) {
              if(deltaY > 0) {
                $(this).spazm('zoom',data.zoom_level - 1);
              }
              else if(deltaY < 0) {
                $(this).spazm('zoom',data.zoom_level + 1);
              }
            });
           
            // touch events
            var docData = $(document).data('viewer');
            if(!docData) {
              // initialize the touchmove blocker for the body
              // $(document).on('touchmove', function(e) { e.preventDefault; });
              // $(document).on('gesturestart', function(e) { e.preventDefault; });
              // $(document).on('gesturechange', function(e) { e.preventDefault; });
              $(document).data('viewer',{});
            }
           
            $(this).on('gesturestart', function(e) {
              startLevel = data.zoom_level;
            });
           
            $(this).on('gesturechange', function(e) {
              // get the current zoom level width
              var w = data.levels[startLevel].width * e.originalEvent.scale;
              var targetZoomLevel = 0;
              if(w < data.min_width) {
                targetZoomLevel = 0;
              }
              else if(w > data.full_width) {
                targetZoomLevel = data.num_zoom_levels;
              }
              else {
                targetZoomLevel = Math.round(((w - data.min_width) / (data.full_width - data.min_width)) * data.num_zoom_levels);
              }

              if(settings.zoom_level != targetZoomLevel) {
                $(this).spazm('zoom',targetZoomLevel);
              }
            });
           
            $(this).on('touchstart', function(e) {
              if(e.originalEvent.touches.length > 1) {
                // @TODO store the center point for gestures
                // for location-based zooming
                return;
              }

              var t = e.originalEvent.changedTouches.item(0);
              mouse_down(e, $(this), t.clientX, t.clientY);
            });
           
            $(this).on('touchmove', function(e) {
              if(e.originalEvent.touches.length > 1) return;
              var t = e.originalEvent.changedTouches.item(0);
              mouse_move(e, $(this),t.clientX, t.clientY);
            });
           
            $(this).on('touchend', function(e) {
              if(e.originalEvent.touches.length > 1) return;
              mouse_up(e, $(this));
            });
          }
        });
      },
     
      /**
      * Zoom to a specific level
      * @param {int} zoom_level Zoom level to zoom too
      * @param {int} x New x position 0..data.min_width
      * @param {int} y New y position 0..data.min_height
      * @return the modified jquery object
      */
      zoom : function (zoom_level,x,y) {
        return this.each( function() {
          var data = $(this).data('viewer');

          if(zoom_level > data.num_zoom_levels || zoom_level < 0 || data.num_zoom_levels === 0) return;

          if(data.debug) console.log('SPAZM: Zooming to level ' + zoom_level + '/' + data.num_zoom_levels);

          var cur_level = data.zoom_level;
          var delta = zoom_level - cur_level;
          data.zoom_level = zoom_level;

          var w = data.levels[zoom_level].width;
          var h = data.levels[zoom_level].height;

          var angle_container = $(this).find('.angles');

          var angle_img = $(this).find('.angle' + data.angle_index);

          var cx,cy,nx,ny;

          if(typeof x != "undefined" && typeof y != "undefined") {
            cx = -angle_container.offset().left + x;
            cy = -angle_container.offset().top + y;
          }
          else {
            cx = -angle_container.offset().left + (data.min_width / 2);
            cy = -angle_container.offset().top + (data.min_height / 2);
          }

          // convert to the center of the image at new zoom width
          cx /= angle_img.width();
          cy /= angle_img.height();
          cx *= w;
          cy *= h;

          // get new top/left based on new center
          nx = -(cx - (data.min_width /2));
          ny = -(cy - (data.min_height /2));

          // constrain to the viewport
          if(nx > 0) nx = 0;
          if(nx < -(w - data.min_width)) nx = -(w - data.min_width);
          if(ny > 0) ny = 0;
          if(ny < -(h - data.min_height)) ny = -(h - data.min_height);

          // mark all tiles in the visible tile layer as recyclable and stop animating
          //$(this).find('.visible > img, .loading > img').addClass('recyclable');

          var old_level = $(this).find('.visible');
          var new_level = $(this).find('.loading');
          new_level.css('left',nx + 'px').css('top',ny + 'px').hide();
          new_level.find('img').stop().hide();

          if(cur_level !== 0) {
            //old_level.find('img').show();
          }

          var t = $(this);

          // animate the zoomed out image position & size
          angle_container.stop().animate({ left:nx, top:ny }, {duration: 500, queue: false, easing: 'swing' });
          //var hotspots_container = $(this).find('.hotspots');
          $(this).find('.hotspots').stop().animate({ left:nx, top:ny, width: w, height: h }, {duration: 500, queue: false, easing: 'swing' });

          zooming = true;
          angle_img.css({textIndent:0});
          var old_w = parseInt(angle_img.css('width'), 10);
          var old_h = parseInt(angle_img.css('height'), 10);
          angle_img.stop().animate({
            textIndent: 100
            //width: w,
            //height: h
          }, {
            duration: 500,
            queue: false,
            easing: 'swing',
            step: function(now, fx) {
              now *= 0.01;
              angle_img.css({'width':old_w + (w - old_w)*(now), 'height': old_h + (h - old_h)*(now)});
              old_level.css('left',angle_container.css('left')).css('top',angle_container.css('top'));

              old_level.find('img').each(function() {
                var td = $(this).data('viewer');
                if(td) {
                  $(this).css('left',(old_w * td.sx + (w * td.sx - old_w * td.sx) * now) + 'px').css('width',(old_w * td.ex + (td.ex * w - old_w * td.ex) * now) + 'px');
                  $(this).css('top',(old_h * td.sy + (h * td.sy - old_h * td.sy) * now) + 'px').css('height',(old_h * td.ey + (td.ey * h - old_h * td.ey) * now) + 'px');
                }
              });

              /*

              var $this = $(this);
              if(fx.prop == "width") {
                old_level.css('left',angle_container.css('left')).css('top',angle_container.css('top'));
                old_level.find('img').each(function() {
                  var td = $(this).data('viewer');
                  if(td) {
                    $(this).css('left',(td.sx * now) + 'px').css('width',(td.ex * now) + 'px');
                  }
                });
              }
              else if(fx.prop == "height") {
                old_level.css('left',angle_container.css('left')).css('top',angle_container.css('top'));
                old_level.find('img').each(function() {
                  var td = $(this).data('viewer');
                  if(td) {
                    $(this).css('top',(td.sy * now) + 'px').css('height',(td.ey * now) + 'px');
                  }
                });
              }
              */
            },
            complete: function() {
              // called on animation complete
              if(data.debug) console.log('SPAZM: Zoom complete');

              // load the new tiles
              loadTilesForLevel(t);

              new_level.removeClass('loading').addClass('visible');
              if(data.zoom_level) {
                new_level.fadeIn();
              }
              else {
                old_level.hide();
              }
              old_level.removeClass('visible').addClass('loading');
              zooming = false;
            }
          });
        });
     }
  };
  
  var onAngleImageLoaded = function($images, $proper, $broken) {
    var data = $(this).parent().data('viewer');
    var loaderDiv = $(this).parent().children('.loader');
    var loadingBar = loaderDiv.find('.bar');
    loaderDiv.stop().show();

    if(loadingImage === 0) {
      $(this).find('img').fadeIn('slow');
    }

    loadingImage = $(this).find('img').length;

    var width = 98 * (loadingImage / data.num_images);
    loadingBar.css('width', width + 'px');

    if(loadingImage < data.num_images) {
      var numToLoad = Math.min(4,data.num_images - loadingImage);
      for(var i = 0; i < numToLoad; i++) {
        $(this).append('<img class="angle' + (loadingImage + i)  + '" src="' + data.prefix + (loadingImage + i) + '_0_0_0.' + data.format + '" style="display:none; width:' + data.min_width + 'px; height:' + data.min_height + 'px" />');
      }
      $(this).imagesLoaded(onAngleImageLoaded);
    }
    else {
      // all done

      loaderDiv.fadeOut();
      loadingAngles = false;
    }
  };

  var loadTilesForLevel = function(elem) {
    var data = elem.data('viewer');
    if(data.zoom_level === 0) return;

    var container = elem.find('.loading');
    container.find('img').attr('src','').attr('id','').hide().addClass('recyclable');

    var x = parseInt(container.css('left'),10);
    var y = parseInt(container.css('top'),10);
    var w = data.levels[data.zoom_level].width;
    var h = data.levels[data.zoom_level].height;

    // calculate which tiles will be needed in the new viewport area
    var ix = Math.floor(-x / data.tile_width);
    var iy = Math.floor(-y / data.tile_height);
    var ex = Math.floor((-x + data.min_width) / data.tile_width);
    var ey = Math.floor((-y + data.min_height) / data.tile_height);

    // load tiles into the new level
    for(;iy <= ey; iy++) {
      ix = Math.floor(-x / data.tile_width);
      for(;ix <= ex; ix++ ) {
        // get a recyclable tile
        var tile = container.find('.recyclable');
        if(!tile.length) {
          console.log('SPAZM: ERROR! No recyclable tile found for level ' + data.zoom_level + ' ' + ix + ' ' + iy);
          break;
        }

        // just get the first match
        tile = tile.eq(0);

        var tw = w - ix * data.tile_width;
        var th = h - iy * data.tile_height;
        if(tw > data.tile_width) tw = data.tile_width;
        if(th > data.tile_width) th = data.tile_height;

        // store the tile origin and width relative to the
        // size of the container for easy scaling calculations
        tile.data('viewer',{
          sx:((ix * data.tile_width) / w),
          sy:((iy * data.tile_height) / h),
          ex:(tw / w),
          ey:(th / h)
        });
        tile.attr('id',data.zoom_level + '_' + ix + '_' + iy);
        tile.attr('src',data.prefix + data.angle_index + '_' + data.zoom_level + '_' + ix + '_' + iy +'.' + data.format);
        tile.css('width',tw + 'px').css('height',th + 'px');
        tile.css('left',ix * data.tile_width).css('top',iy * data.tile_height);
        tile.removeClass('recyclable');
      }
    }

    loadImages(container, elem, function(loaded) {
      loaded.each(function() {
        if(!$(this).is(':visible') && !$(this).is('.recyclable')) {
          $(this).fadeIn();
        }
      });
    },
    function(images) {
      elem.find('.loading').hide();
    });
  };
  
  /**
   * Given specific min and max sizes and # of zoom levels
   * create an array of image sizes at each zoom level
   * @param {int} numLevels
   * @param {int} minWidth
   * @param {int} minHeight
   * @param {int} maxWidth
   * @param {int} maxHeight
   * @return {array} Array of level sizes
   */
  var getLevelSizes = function(numLevels, minWidth, minHeight, maxWidth, maxHeight) {
    var lvlWidth = minWidth;
    var lvlHeight = minHeight;
    var dx =  parseInt((maxWidth - minWidth) / numLevels,10);
    var dy =  parseInt((maxHeight - minHeight) / numLevels,10);

    var levels = [];
    for(var level = 0; level <= numLevels; level++) {
      if(level == numLevels) {
        levels.push({width: maxWidth, height: maxHeight});
      }
      else {
        levels.push({width: lvlWidth, height: lvlHeight });
      }

      lvlWidth += dx;
      lvlHeight += dy;
    }

    return levels;
  };
  
  /**
   * Load images inside a specific element.
   * @param {object} container The jQuery element containing the images
   * @param {object} parent The jQuery element with the viewer data
   * @param {function} progressCallback Optional callback on progress
   * @param {function} completeCallback Optional callback on complete
   */
  var loadImages = function(container, parent, progressCallback, completeCallback) {
    var loaderDiv = parent.children('.loader');
    var loadingBar = loaderDiv.find('.bar');
    loaderDiv.show();

    var loader = container.imagesLoaded();
    loader.always( function( images ) {
      var width = 98 * (parent.data('viewer').num_loaded / images.length);
      loadingBar.css('width', width + 'px');
      loaderDiv.fadeOut();
      if(completeCallback) completeCallback(images);
    });
      
    loader.done( function() {
    });
      
    loader.progress( function(isBroken, images, proper, broken) {
      parent.data('viewer').num_loaded = proper.length;

      var width = 98 * (parent.data('viewer').num_loaded / images.length);
      loadingBar.css('width', width + 'px');

      if(progressCallback) progressCallback(proper);
    });
  };
  
  var pad = function(num, length) {
    var s = num.toString();
    while(s.length < length) {
      s = '0' + s;
    }
    return s;
  };
  
  var mouse_down = function(e, elem, x, y) {
    e.preventDefault();
    panning = true;
    panned = false;
    oldX = x;
    oldY = y;
    startX = x;
    startY = y;
    startAngle = elem.data('viewer').angle_index;
  };
  
  var mouse_move = function(e, elem, x, y) {
    e.preventDefault();
    if(!panning || zooming) return;
    
    panned = true;

    var data = elem.data('viewer');

    var dx,dy;
    if(data.zoom_level === 0 && loadingAngles === false) {
      // rotate
      var old_angle = elem.find('.angle' + data.angle_index );
      old_angle.hide();

      dx = Math.round((x - startX) / 15);
      if(!data.rotate_right) {
        dx = -dx;
      }

      data.angle_index = (startAngle + dx) % data.num_images;
      if(data.angle_index < 0) data.angle_index += data.num_images;

      var new_angle =elem.find('.angle' + data.angle_index);
      new_angle.show();
    }
    else {
      // stop animating any pan
      elem.find('.angles').stop();

      // pan
      var w = data.levels[data.zoom_level].width;
      var h = data.levels[data.zoom_level].height;

      dx = x - oldX;
      dy = y - oldY;

      elem.find('.visible,.angles,.loading').each(function() {
        var nx = parseFloat($(this).css('left'));
        var ny = parseFloat($(this).css('top'));
        nx += dx;
        ny += dy;

        if(nx > 0) nx = 0;
        if(nx < -(w - data.min_width)) nx = -(w - data.min_width);
        if(ny > 0) ny = 0;
        if(ny < -(h - data.min_height)) ny = -(h - data.min_height);

        $(this).css('left',nx).css('top',ny);
      });

      elem.find('.hotspots').stop().css('left',elem.find('.angles').css('left')).css('top',elem.find('.angles').css('top'));
    }

    oldX = x;
    oldY = y;
  };
  
  var mouse_up = function(e,elem) {
    e.preventDefault();

    var data = elem.data('viewer');

    if(panned && data.zoom_level > 0) {
      var container = elem.find('.visible');
      var x = parseInt(container.css('left'),10);
      var y = parseInt(container.css('top'),10);
      var w = data.levels[data.zoom_level].width;
      var h = data.levels[data.zoom_level].height;

      // calculate which tiles will be needed in the new viewport area
      var ix = Math.floor(-x / data.tile_width);
      var iy = Math.floor(-y / data.tile_height);
      var ex = Math.floor((-x + data.min_width) / data.tile_width);
      var ey = Math.floor((-y + data.min_height) / data.tile_height);

      container.find('img').each(function() {
        if($(this).hasClass('recyclable')) {
          $(this).attr('id','');
            return;
        }

        // flag as recyclable if outside the viewport
        var tx = parseInt($(this).css('left'),10);
        var ty = parseInt($(this).css('top'),10);
        var tw = parseInt($(this).css('width'),10);
        var th = parseInt($(this).css('height'),10);

        if( tx > (-x + data.min_width) || ty > (-y + data.min_height) ||
          (tx + tw < -x) || (ty + th < -y)) {
          $(this).attr('id','').attr('src','').hide().addClass('recyclable');
        }
      });

      // load tiles into the new level
      for(;iy <= ey; iy++) {
        ix = Math.floor(-x / data.tile_width);
        for(;ix <= ex; ix++ ) {
          var tile = container.find('#' + data.zoom_level + '_' + ix + '_' + iy);
          if(tile.length) continue;

          // get a recyclable tile
          tile = container.find('.recyclable');
          if(!tile.length) {
            console.log('SPAZM: ERROR! No recyclable tile found for level ' + data.zoom_level + ' ' + ix + ' ' + iy);
            break;
          }

          // just get the first match
          tile = tile.eq(0);
          tile.removeClass('recyclable');

          var tw = w - ix * data.tile_width;
          var th = h - iy * data.tile_height;
          if(tw > data.tile_width) tw = data.tile_width;
          if(th > data.tile_width) th = data.tile_height;

          // store the tile origin and width relative to the
          // size of the container for easy scaling calculations
          tile.data('viewer',{
            sx:((ix * data.tile_width) / w),
            sy:((iy * data.tile_height) / h),
            ex:(tw / w),
            ey:(th / h)
          });
          tile.attr('id',data.zoom_level + '_' + ix + '_' + iy);
          tile.attr('src',data.prefix + data.angle_index + '_' + data.zoom_level + '_' + ix + '_' + iy +'.' + data.format);
          tile.css('width',tw + 'px').css('height',th + 'px');
          tile.css('left',ix * data.tile_width).css('top',iy * data.tile_height);
          tile.hide();
        }
      }

      loadImages(container, elem, function(loaded) {
        loaded.each(function() {
          if(!$(this).is(':visible') && !$(this).is('.recyclable')) {
            $(this).fadeIn();
          }
        });
      },
      function(images) {
        elem.find('.loading').hide();
      });
    }
    else if(panning && !panned) {
      var d = new Date();
      var m = d.getTime();

      // double click
      if(m - 500 < lastClickTime) {
        if(data.zoom_level == data.num_zoom_levels) {
          if(data.debug) console.log('SPAZM: Zooming out');
          elem.spazm('zoom',0);
        }
        else {
          if(data.debug) console.log('SPAZM: Zooming in to point (' + oldX + ',' + oldY + ')');
          elem.spazm('zoom',data.zoom_level + 1, oldX, oldY);
        }
      }
      lastClickTime = m;
    }

    panning = false;
    panned = false;
  };
  
  $.fn.spazm = function( method ) {
    if ( methods[method] ) {
      return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
    } else if ( typeof method === 'object' || ! method ) {
      return methods.init.apply( this, arguments );
    } else {
      $.error( 'Method ' +  method + ' does not exist on jQuery.spazm' );
    }
  };

})( jQuery );
