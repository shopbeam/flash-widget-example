Flash-Widget-Example
====================

This is an example of a flash swf Shopbeam widget app. It's analogous to the angular (html5/javascript) widget app; both of which communicate with the same Shopbeam lightbox, cart and checkout apps in the Shopbeam suite.

Using Shopbeam's Flash Widget:
------------------------------

To use Shopbeam's flash widget app please [visit the widget paste-code generator](#). This generator will output valid, paste-ready html including unique wiget uuids.


Using a Custom Flash Widget:
----------------------------

###Actionscript Example
```actionscript
import flash.events.Event;
import flash.events.IOErrorEvent;
import flash.system.SecurityDomain;

Security.allowDomain('*');

var widgetUuid:String = stage.loaderInfo.parameters.widgetUuid;
var widgetData:Object;
var loader:Loader = new Loader();
var loadingError:Function;
var loaderClickHandler:Function;

ExternalInterface.addCallback('setWidgetData', setWidgetData);
function setWidgetData(data:String):void {
	widgetData = JSON.parse(data);
	loader.load(new URLRequest(widgetData.embedImage.url));
}

preInit();
init();
postInit();

function preInit():void {
	stage.addChild(loader);
	loader.x = 0;
	loader.y = 0;

	loader.contentLoaderInfo.addEventListener(Event.COMPLETE,doneLoad);
	
	function doneLoad(e:Event):void {
		loader.contentLoaderInfo.removeEventListener(Event.COMPLETE,doneLoad);
		loader.contentLoaderInfo.removeEventListener(IOErrorEvent.IO_ERROR,loadingError);
	}
}

function init():void {
	trace('framedInit called for ' + widgetUuid);
	loadingError = function(e:IOErrorEvent):void {
		ExternalInterface.call('console.error', 'SwfWidget with id: ' + widgetUuid + ' couldn\'t load image');
	}
	
	loaderClickHandler = function(e:Event):void {
		ExternalInterface.call('Shopbeam.swfOpenLightbox', widgetUuid);
	}
}

function postInit():void {
	loaderClickHandler = function(e:Event):void {
		ExternalInterface.call('Shopbeam.swfOpenLightbox', widgetUuid);
	}
	loader.addEventListener(MouseEvent.CLICK, loaderClickHandler);
	loader.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR,loadingError);
}
```

###Markup Template
_NOTE: text inside of angle brackets (i.e. `<example>`) is **placeholder** text and is intended to be replaced. Also any `uuid` must conform to the [uuid spec](http://en.wikipedia.org/wiki/Universally_unique_identifier), if it does not, an error will be raised when attampting to checkout with a product added from the malormed widget_

```html
<object type="application/x-shockwave-flash" data="<url for single-widget.swf>" id="shopbeam-widget-swf-unbootstrapped-<widget uuid (must be UNIQUE!)>" data-image-src="<url for widget embed image>" data-shopbeam-url="<shopbeam product api path (excludes protocol, port and domain)>" width="<width in pixels (number)>" height="<height in pixels (number)>">
  <param name="movie" value="<url for single-widget.swf>"/>
  <!--NOTE: the "value" of FlashVars MUST be urlEncoded!!!-->
  <param name="FlashVars" value="widgetUuid=<widget uuid (must be UNIQUE!)>"/>
  <param name="allowscriptaccess" value="always"/>
</object>
```
