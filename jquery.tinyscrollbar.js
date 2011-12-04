/*!
 * Tiny Scrollbar 1.65
 * http://www.baijs.nl/tinyscrollbar/
 *
 * Copyright 2010, Maarten Baijs
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.opensource.org/licenses/gpl-2.0.php
 *
 * Date: 10 / 05 / 2011
 * Depends on library: jQuery
 *
 */

(function($){
  $.tiny = $.tiny || { };

  $.tiny.scrollbar = {
    options: {
      axis: 'y', // vertical or horizontal scrollbar? ( x || y ).
      wheel: 40,  //how many pixels must the mouswheel scroll at a time.
      scroll: true, //enable or disable the mousewheel;
      size: 'auto', //set the size of the scrollbar to auto or a fixed number.
      sizethumb: 'auto' //set the size of the thumb to auto or a fixed number.
    }
  };

  $.fn.tinyscrollbar = function(options) {
    var options = $.extend({}, $.tiny.scrollbar.options, options);
    this.each(function(){ $(this).data('tsb', new Scrollbar($(this), options)); });
    return this;
  };
  $.fn.tinyscrollbar_update = function(sScroll) { return $(this).data('tsb').update(sScroll); };

  function Scrollbar(root, options){
    var self = this;
    var wrapper = root;
    var viewport = $('.viewport', root);
    var content = $('.overview', root);
    var scrollbar = $('.scrollbar', root);
    var track = $('.track', scrollbar);
    var thumb = $('.thumb', scrollbar);
    var xAxis = options.axis == 'x',
        cssDirection = xAxis ? 'left' : 'top',
        sSize = xAxis ? 'Width' : 'Height';
    var iScroll, scrollSize, offscreenSize, scrollbarRatio, iPosition = { start: 0, now: 0 }, iMouse = {};

    this.active = function() {
      return self.contentRatio < 1;
    }
    function requirements_met() {
      return (viewport.length && content.length && scrollbar.length && track.length && thumb.length)
    }

    function initialize() {
      if (requirements_met()) {
        self.update();
        setEvents();
      }
      return self;
    }
    this.update = function(sScroll){
      if (!requirements_met()) {
        $.error("Missing required tinyscrollbar sub-element: either .viewport .overview .scrollbar .track or .thumb");
      }
      var viewportSize = viewport[0]['offset'+ sSize];
      var contentSize = content[0]['scroll'+ sSize];
      offscreenSize = contentSize - viewportSize;
      self.contentRatio = viewportSize / contentSize;
      scrollbar.toggleClass('disable', !self.active());
      var trackSize = options.size == 'auto' ? viewportSize : options.size;
      var thumbSize = Math.min(trackSize, Math.max(0, ( options.sizethumb == 'auto' ? (trackSize * self.contentRatio) : options.sizethumb )));
      scrollSize = trackSize - thumbSize;
      scrollbarRatio = options.sizethumb == 'auto' ? (contentSize / trackSize) : offscreenSize / scrollSize;
      if (self.active() && sScroll == 'relative') {
        iScroll = Math.min(offscreenSize, Math.max(0, iScroll));
      } else if (self.active() <= 1 && sScroll == 'bottom') {
        iScroll = offscreenSize
      } else {
        iScroll = isNaN(parseInt(sScroll)) ? 0 : parseInt(sScroll)
      }

      thumb.css(cssDirection, iScroll / scrollbarRatio);
      content.css(cssDirection, -iScroll);
      iMouse['start'] = thumb.offset()[cssDirection];
      var sCssSize = sSize.toLowerCase();
      scrollbar.css(sCssSize, trackSize);
      track.css(sCssSize, trackSize);
      thumb.css(sCssSize, thumbSize);
    };
    function setEvents(){
      thumb.bind('mousedown', start);
      thumb[0].ontouchstart = function(event){
        event.preventDefault();
        thumb.unbind('mousedown');
        start(event.touches[0]);
        return false;
      };
      track.bind('mouseup', drag);
      if(options.scroll && this.addEventListener){
        wrapper[0].addEventListener('DOMMouseScroll', wheel, false);
        wrapper[0].addEventListener('mousewheel', wheel, false );
      }
      else if(options.scroll){wrapper[0].onmousewheel = wheel;}
    };
    function start(event){
      iMouse.start = xAxis ? event.pageX : event.pageY;
      var thumbDir = parseInt(thumb.css(cssDirection));
      iPosition.start = thumbDir == 'auto' ? 0 : thumbDir;
      $(document).bind('mousemove', drag);
      document.ontouchmove = function(event){
        $(document).unbind('mousemove');
        drag(event.touches[0]);
      };
      $(document).bind('mouseup', end);
      thumb.bind('mouseup', end);
      thumb[0].ontouchend = document.ontouchend = function(event){
        $(document).unbind('mouseup');
        thumb.unbind('mouseup');
        end(event.touches[0]);
      };
      return false;
    };
    function wheel(event){
      if(self.active()){
        event = $.event.fix(event || window.event);
        var iDelta = event.wheelDelta ? event.wheelDelta/120 : -event.detail/3;
        iScroll -= iDelta * options.wheel;
        iScroll = Math.min(offscreenSize, Math.max(0, iScroll));
        thumb.css(cssDirection, iScroll / scrollbarRatio);
        content.css(cssDirection, -iScroll);
        event.preventDefault();
      };
    };
    function end(event){
      $(document).unbind('mousemove', drag).unbind('mouseup', end);
      thumb.unbind('mouseup', end);
      document.ontouchmove = thumb[0].ontouchend = document.ontouchend = null;
      return false;
    };
    function drag(event){
      if(self.active()){
        iPosition.now = Math.min(scrollSize, Math.max(0, (iPosition.start + ((xAxis ? event.pageX : event.pageY) - iMouse.start))));
        iScroll = iPosition.now * scrollbarRatio;
        content.css(cssDirection, -iScroll);
        thumb.css(cssDirection, iPosition.now);
      }
      return false;
    };

    return initialize();
  };
})(jQuery);
