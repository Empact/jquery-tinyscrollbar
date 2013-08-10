/*!
 * Tiny Scrollbar 1.66
 * http://www.baijs.nl/tinyscrollbar/
 *
 * Copyright 2010, Maarten Baijs
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.opensource.org/licenses/gpl-2.0.php
 *
 * Date: 13 / 11 / 2011
 * Depends on library: jQuery
 * 
 * Source of this fork https://github.com/CGeorges/jquery-tinyscrollbar
 */

(function($){
	$.tiny = $.tiny || { };
	
	$.tiny.scrollbar = {
		options: {	
			axis: 'y', // vertical or horizontal scrollbar? ( x || y ).
			wheel: 40,  //how many pixels must the mouswheel scroll at a time.
			scroll: true, //enable or disable the mousewheel;
			lockscroll : true,   // return scrollwheel to browser if there is no more content.
			arrows: 40, //how many pixels should move the scroll on a arrow click, false to disable.
			arrowsSpeed: 70, //if mouse button is down, what speed (milliseconds) you want the loop to repeat
			size: 'auto', //set the size of the scrollbar to auto or a fixed number.
			sizethumb: 'auto' //set the size of the thumb to auto or a fixed number.
		}
	};	
	
	$.fn.tinyscroll = function(options) {
		if (options && options.axis == 'x') var horizontal = true;
		this.wrapInner('<div class="viewport"><div class="overview">');
		var width = this.width();
		var height = this.height();	
		this.append('<div class="scrollbar"><div class="track"><div class="thumb"><div class="end"></div></div></div></div>');
		if (horizontal) {
			this.find('.viewport').width(width).height(height-15);
		} else {
			this.find('.viewport').width(width-15).height(height);
		}
		if (horizontal) this.children('.scrollbar').addClass('horizontal');
		this.tinyscrollbar(options);
		return this;
	}
	
	$.fn.tinyscrollbar = function(options) { 
		var options = $.extend({}, $.tiny.scrollbar.options, options); 		
		this.each(function(){ $(this).data('tsb', new Scrollbar($(this), options)); });
		return this;
	};
	$.fn.tinyscrollbar_update = function(sScroll, duration) { return $(this).data('tsb').update(sScroll, duration); };
	
	function Scrollbar(root, options){
		var oSelf = this,
		oWrapper = root,
		oViewport = { obj: $('.viewport', root) },
		oContent = { obj: $('.overview', root) },
		oScrollbar = { obj: $('.scrollbar', root) },
		oTrack = { obj: $('.track', oScrollbar.obj) },
		oUpArrow = { obj: $('.uparrow', oScrollbar.obj) },
		oDownArrow = { obj: $('.downarrow', oScrollbar.obj) },
		oThumb = { obj: $('.thumb', oScrollbar.obj) },
		sAxis = options.axis == 'x', sDirection = sAxis ? 'left' : 'top', sSize = sAxis ? 'Width' : 'Height',
		iScroll, iPosition = { start: 0, now: 0 }, iMouse = {},
		reverse = false,
		timeout = null;
		function initialize() {	
			oSelf.update();
			setEvents();
			return oSelf;
		}
		this.update = function(sScroll, duration){
			oViewport[options.axis] = oViewport.obj[0]['offset'+ sSize];
			oContent[options.axis] = oContent.obj[0]['scroll'+ sSize];
			oContent.ratio = oViewport[options.axis] / oContent[options.axis];
			oScrollbar.obj.toggleClass('disable', oContent.ratio >= 1);
			oTrack[options.axis] = options.size == 'auto' ? oViewport[options.axis] : options.size;
			oThumb[options.axis] = Math.min(oTrack[options.axis], Math.max(0, ( options.sizethumb == 'auto' ? (oTrack[options.axis] * oContent.ratio) : options.sizethumb )));
			oScrollbar.ratio = options.sizethumb == 'auto' ? (oContent[options.axis] / oTrack[options.axis]) : (oContent[options.axis] - oViewport[options.axis]) / (oTrack[options.axis] - oThumb[options.axis]);
			iScroll = (sScroll == 'relative' && oContent.ratio <= 1) ? Math.min((oContent[options.axis] - oViewport[options.axis]), Math.max(0, iScroll)) : 0;
			iScroll = (sScroll == 'bottom' && oContent.ratio <= 1) ? (oContent[options.axis] - oViewport[options.axis]) : isNaN(parseInt(sScroll)) ? iScroll : parseInt(sScroll);
			setSize(duration);
		};
		function setSize(duration){
			if (!duration) var duration = 0;
			var anim = {}; anim[sDirection] = iScroll / oScrollbar.ratio; 
			oThumb.obj.animate(anim, duration);
			anim[sDirection] = -iScroll;
			oContent.obj.animate(anim, duration);
			iMouse['start'] = oThumb.obj.offset()[sDirection];
			var sCssSize = sSize.toLowerCase(); 
			oScrollbar.obj.css(sCssSize, oTrack[options.axis]);
			oTrack.obj.css(sCssSize, oTrack[options.axis]);
			oThumb.obj.css(sCssSize, oThumb[options.axis]);		
		};		
		function setEvents(){
			oThumb.obj.bind('mousedown', start);
			oThumb.obj[0].ontouchstart = function(oEvent){
				oEvent.preventDefault();
				oThumb.obj.unbind('mousedown');
				start(oEvent.touches[0]);
				return false;
			};
			oWrapper[0].ontouchstart = function(oEvent){
				iMouse.start = sAxis ? oEvent.touches[0].pageX : oEvent.touches[0].pageY;
				var oThumbDir = parseInt(oThumb.obj.css(sDirection));
				iPosition.start = oThumbDir == 'auto' ? 0 : oThumbDir;
			};
			oWrapper[0].ontouchmove = function(oEvent){
				oEvent.preventDefault();
				drag(oEvent.touches[0], true);
				return false;
			};
			oTrack.obj.bind('mouseup', drag);
			if(options.arrows)
			{
				oUpArrow.obj.bind('mousedown', up).bind('mouseup mouseleave',endArrow);
				oDownArrow.obj.bind('mousedown', down).bind('mouseup mouseleave',endArrow);
			}
			if(options.scroll && this.addEventListener){
				oWrapper[0].addEventListener('DOMMouseScroll', wheel, false);
				oWrapper[0].addEventListener('mousewheel', wheel, false );
			}
			else if(options.scroll){oWrapper[0].onmousewheel = wheel;}
		};
		function start(oEvent) {
			iMouse.start = sAxis ? oEvent.pageX : oEvent.pageY;
			var oThumbDir = parseInt(oThumb.obj.css(sDirection));
			iPosition.start = oThumbDir == 'auto' ? 0 : oThumbDir;
			$(document).bind('mousemove', drag);
			document.ontouchmove = function(oEvent){
				$(document).unbind('mousemove');
				drag(oEvent.touches[0]);
			};
			$(document).bind('mouseup', end);
			oThumb.obj.bind('mouseup', end);
			oThumb.obj[0].ontouchend = document.ontouchend = function(oEvent){
				$(document).unbind('mouseup');
				oThumb.obj.unbind('mouseup');
				end(oEvent.touches[0]);
			};
			return false;
		};		
		function wheel(oEvent){
			if(!(oContent.ratio >= 1)){
				var oEvent = oEvent || window.event;
				var iDelta = oEvent.wheelDelta ? oEvent.wheelDelta/120 : -oEvent.detail/3;
				iScroll -= iDelta * options.wheel;
				iScroll = Math.min((oContent[options.axis] - oViewport[options.axis]), Math.max(0, iScroll));
				oThumb.obj.css(sDirection, iScroll / oScrollbar.ratio);
				oContent.obj.css(sDirection, -iScroll);
				if( options.lockscroll || ( iScroll !== ( oContent[ options.axis ] - oViewport[ options.axis ] ) && iScroll !== 0 ) )
                {
					oEvent = $.event.fix(oEvent);
					oEvent.preventDefault();
				}
			};
		};
		function up(oEvent){
			if(!(oContent.ratio >= 1)){
				timeout = setInterval(function(){
					iScroll -= options.arrows;
					iScroll = Math.min((oContent[options.axis] - oViewport[options.axis]), Math.max(0, iScroll));
					oThumb.obj.css(sDirection, iScroll / oScrollbar.ratio);
					oContent.obj.css(sDirection, -iScroll);

					if( options.lockscroll || ( iScroll !== ( oContent[ options.axis ] - oViewport[ options.axis ] ) && iScroll !== 0 ) )
	                {
						oEvent = $.event.fix(oEvent);
						oEvent.preventDefault();
					}
				},options.arrowsSpeed);
			}
		}
		function down(oEvent){
			if(!(oContent.ratio >= 1)){
				timeout = setInterval(function(){
					iScroll += options.arrows;
					iScroll = Math.min((oContent[options.axis] - oViewport[options.axis]), Math.max(0, iScroll));
					oThumb.obj.css(sDirection, iScroll / oScrollbar.ratio);
					oContent.obj.css(sDirection, -iScroll);
					if( options.lockscroll || ( iScroll !== ( oContent[ options.axis ] - oViewport[ options.axis ] ) && iScroll !== 0 ) )
	                {
						oEvent = $.event.fix(oEvent);
						oEvent.preventDefault();
					}
				},options.arrowsSpeed);
				
			}
		}
		function endArrow(oEvent)
		{
			clearInterval(timeout);
		}
		function end(oEvent){
			$(document).unbind('mousemove', drag);
			$(document).unbind('mouseup', end);
			oThumb.obj.unbind('mouseup', end);
			document.ontouchmove = oThumb.obj[0].ontouchend = document.ontouchend = null;
			clearInterval(timeout)
			return false;
		};
		function drag(oEvent){
			reverse = arguments.length == 2 ? arguments[1] : false;
			if(!(oContent.ratio >= 1)){
				iPosition.now = Math.min((oTrack[options.axis] - oThumb[options.axis]), Math.max(0, (iPosition.start + (reverse ? -1 : 1) * ((sAxis ? oEvent.pageX : oEvent.pageY) - iMouse.start))));
				iScroll = iPosition.now * oScrollbar.ratio;
				oContent.obj.css(sDirection, -iScroll);
				oThumb.obj.css(sDirection, iPosition.now);
			}
			return false;
		};
		
		return initialize();
	};
})(jQuery);