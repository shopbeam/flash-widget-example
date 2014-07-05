Flash-Widget-Example
====================

This is an example of a flash swf Shopbeam widget app. It's analogous to the angular (html5/javascript) widget app; both of which communicate with the same Shopbeam lightbox, cart and checkout apps in the Shopbeam suite.

Using Shopbeam's Flash Widget:
------------------------------

To use Shopbeam's flash widget app please [visit the widget paste-code generator](#). This generator will output valid, paste-ready html including unique wiget uuids.


Using a Custom Flash Widget:
----------------------------

###Actionscript

####Loader
```actionscript
var loader:Loader = new Loader();
var loadingError:Function;
var loaderClickHandler:Function;

stage.addChild(loader);
loader.x = 0;
loader.y = 0;

loader.contentLoaderInfo.addEventListener(Event.COMPLETE,doneLoad);
	
function doneLoad(e:Event):void {
	loader.contentLoaderInfo.removeEventListener(Event.COMPLETE,doneLoad);
	loader.contentLoaderInfo.removeEventListener(IOErrorEvent.IO_ERROR,loadingError);
}

loadingError = function(e:IOErrorEvent):void {
	ExternalInterface.call('console.error', 'SwfWidget with id: ' + widgetUuid + ' couldn\'t load image');
}
	
loaderClickHandler = function(e:Event):void {
	ExternalInterface.call('Shopbeam.swfOpenLightbox', widgetUuid);
}

loader.addEventListener(MouseEvent.CLICK, loaderClickHandler);
loader.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR,loadingError);
```

####ExternalInterface
`setWidgetData` must be defined: This hook receives a `String` argument which is stringified JSON object containing information about the embedded product/variant:

_NOTE: the phrase "embedded variant" refers to the variant whose `id` is in the query to the shopbeam api; e.g. for api url `/v1/products?id=123456`, the embedded variant's id is `123456`. For more info referene the [Shobeam API docs](#)_

```json
{
  "outOfStock": "<boolean: true when the embedded product's variants are out of stock>",
  "initialProduct": {
    "brandName": "<embedded variant's brand name>",
    "name": "<embedded variant's product name>"
  },
  "initialImage":{
    "url":"https://cloudinary-a.akamaihd.net/shopbeam/image/fetch/w_350,h_536,c_pad/ht…nmarcus.com%2Fca%2F1%2Fproduct_assets%2FH%2F7%2F6%2F1%2FP%2FNMH761P_mz.jpg"
  },
  "embedImage":{
    "url":"https://cloudinary-a.akamaihd.net/shopbeam/image/fetch/w_350,h_536,c_pad/ht…nmarcus.com%2Fca%2F1%2Fproduct_assets%2FH%2F7%2F6%2F1%2FP%2FNMH761P_mz.jpg"
  },
  "apiKey":"bdac27b3-9e03-42b6-93bb-050a9ac01c10",
  "options":{
    "widgetId":"7a85cq79-5e7c-32d9-b509-cacb17b5e21e",
    "productsUrl":"https://www.shopbeamtest.com:4000/v1/products?id=8461791&image=1&apiKey=bdac27b3-9e03-42b6-93bb-050a9ac01c10",
    "initialImageSource":"https://cloudinary-a.akamaihd.net/shopbeam/image/fetch/w_350,h_536,c_pad/ht…nmarcus.com%2Fca%2F1%2Fproduct_assets%2FH%2F7%2F6%2F1%2FP%2FNMH761P_mz.jpg"
  }
}
```

```actionscript
var widgetData:Object;

ExternalInterface.addCallback('setWidgetData', setWidgetData);
function setWidgetData(data:String):void {
	widgetData = JSON.parse(data);
	loader.load(new URLRequest(widgetData.embedImage.url));
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
