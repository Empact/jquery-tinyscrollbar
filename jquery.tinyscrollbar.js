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
    var viewport = { obj: $('.viewport', root) };
    var content = { obj: $('.overview', root) };
    var scrollbar = { obj: $('.scrollbar', root) };
    var track = { obj: $('.track', scrollbar.obj) };
    var thumb = { obj: $('.thumb', scrollbar.obj) };
    var xAxis = options.axis == 'x',
        cssDirection = xAxis ? 'left' : 'top',
        sSize = xAxis ? 'Width' : 'Height';
    var iScroll, iPosition = { start: 0, now: 0 }, iMouse = {};

    function initialize() {
      self.update();
      setEvents();
      return self;
    }
    this.update = function(sScroll){
      viewport[options.axis] = viewport.obj[0]['offset'+ sSize];
      content[options.axis] = content.obj[0]['scroll'+ sSize];
      content.ratio = viewport[options.axis] / content[options.axis];
      scrollbar.obj.toggleClass('disable', content.ratio >= 1);
      track[options.axis] = options.size == 'auto' ? viewport[options.axis] : options.size;
      thumb[options.axis] = Math.min(track[options.axis], Math.max(0, ( options.sizethumb == 'auto' ? (track[options.axis] * content.ratio) : options.sizethumb )));
      scrollbar.ratio = options.sizethumb == 'auto' ? (content[options.axis] / track[options.axis]) : (content[options.axis] - viewport[options.axis]) / (track[options.axis] - thumb[options.axis]);
      iScroll = (sScroll == 'relative' && content.ratio <= 1) ? Math.min((content[options.axis] - viewport[options.axis]), Math.max(0, iScroll)) : 0;
      iScroll = (sScroll == 'bottom' && content.ratio <= 1) ? (content[options.axis] - viewport[options.axis]) : isNaN(parseInt(sScroll)) ? iScroll : parseInt(sScroll);
      setSize();
    };
    function setSize(){
      thumb.obj.css(cssDirection, iScroll / scrollbar.ratio);
      content.obj.css(cssDirection, -iScroll);
      iMouse['start'] = thumb.obj.offset()[cssDirection];
      var sCssSize = sSize.toLowerCase();
      scrollbar.obj.css(sCssSize, track[options.axis]);
      track.obj.css(sCssSize, track[options.axis]);
      thumb.obj.css(sCssSize, thumb[options.axis]);
    };
    function setEvents(){
      thumb.obj.bind('mousedown', start);
      thumb.obj[0].ontouchstart = function(event){
        event.preventDefault();
        thumb.obj.unbind('mousedown');
        start(event.touches[0]);
        return false;
      };
      track.obj.bind('mouseup', drag);
      if(options.scroll && this.addEventListener){
        wrapper[0].addEventListener('DOMMouseScroll', wheel, false);
        wrapper[0].addEventListener('mousewheel', wheel, false );
      }
      else if(options.scroll){wrapper[0].onmousewheel = wheel;}
    };
    function start(event){
      iMouse.start = xAxis ? event.pageX : event.pageY;
      var thumbDir = parseInt(thumb.obj.css(cssDirection));
      iPosition.start = thumbDir == 'auto' ? 0 : thumbDir;
      $(document).bind('mousemove', drag);
      document.ontouchmove = function(event){
        $(document).unbind('mousemove');
        drag(event.touches[0]);
      };
      $(document).bind('mouseup', end);
      thumb.obj.bind('mouseup', end);
      thumb.obj[0].ontouchend = document.ontouchend = function(event){
        $(document).unbind('mouseup');
        thumb.obj.unbind('mouseup');
        end(event.touches[0]);
      };
      return false;
    };
    function wheel(event){
      if(content.ratio < 1){
        event = $.event.fix(event || window.event);
        var iDelta = event.wheelDelta ? event.wheelDelta/120 : -event.detail/3;
        iScroll -= iDelta * options.wheel;
        iScroll = Math.min((content[options.axis] - viewport[options.axis]), Math.max(0, iScroll));
        thumb.obj.css(cssDirection, iScroll / scrollbar.ratio);
        content.obj.css(cssDirection, -iScroll);
        event.preventDefault();
      };
    };
    function end(event){
      $(document).unbind('mousemove', drag).unbind('mouseup', end);
      thumb.obj.unbind('mouseup', end);
      document.ontouchmove = thumb.obj[0].ontouchend = document.ontouchend = null;
      return false;
    };
    function drag(event){
      if(content.ratio < 1){
        iPosition.now = Math.min((track[options.axis] - thumb[options.axis]), Math.max(0, (iPosition.start + ((xAxis ? event.pageX : event.pageY) - iMouse.start))));
        iScroll = iPosition.now * scrollbar.ratio;
        content.obj.css(cssDirection, -iScroll);
        thumb.obj.css(cssDirection, iPosition.now);
      }
      return false;
    };

    return initialize();
  };
})(jQuery);
