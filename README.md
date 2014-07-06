Flash-Widget-Example -- DOCUMENTATION WIP
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

#####Wiget Data:
```json
{
   "outOfStock": <boolean: true when the embedded product's variants are out of stock>,
   "initialProduct": {
      "id": 1883823,
      "name": "<embedded variant's product name>",
      "description": "<html: product description>",
      "minPrice": <integer: IDK>,
      "maxPrice": <integer: IDK>,
      "maxListPrice": <integer: maximum list price in cents>,
      "minListPrice": <integer: minimum list pirce in cents>,
      "salePercent": <integer: IDK>,
      "partnerId": <integer: partner Id>,
      "partnerCommission": <integer: IDK, probably in cents>,
      "partnerName": "<partner name>",
      "brandId": <integer: partner Id>,
      "brandName": "<brand name>",
      "colorSubstitute": null,
      "createdAt": "<timestamp: date and time when product was first added to the DB>",
      "categories":[
         {
            "id": <integer: category Id>,
            "name": "<string: category name>"
         },
         ...
      ],
      "variants":[
         {
            "id": <integer>,
            "color": "<string: variant color name>",
            "colorFamily": [
               "<string: IDK>"
            ],
            "size": "<string: variant size, non-standard>",
            "listPrice": <integer: list price in cents>,
            "salePrice": <integer: sale price in cents (if no sale, this will be equal to the list price)>,
            "images": [
               {
                  "id": <integer: image id>,
                  "url": "<integer: image url (cloudinary CDN)>"
               },
               ...
            ]
         },
         ...
      ]
   },
   "initialVariant": {
      "id": <integer: embedded variant Id>,
      "color": "<string: embedded variant>",
      "colorFamily":[
         "silver"
      ],
      "size":"",
      "listPrice":42500,
      "salePrice":21200,
      "images":[
         {
            "id":30966526,
            "url":"http://images.neimanmarcus.com/ca/1/product_assets/T/7/G/F/9/NMT7GF9_mz.jpg"
         },
         {
            "id":30966527,
            "url":"http://images.neimanmarcus.com/ca/1/product_assets/T/7/G/F/9/NMT7GF9_az.jpg"
         }
      ]
   },
   "initialImage":{
      "id":30966526,
      "url":"http://images.neimanmarcus.com/ca/1/product_assets/T/7/G/F/9/NMT7GF9_mz.jpg"
   },
   "embedImage":{
      "url":"https://cloudinary-a.akamaihd.net/shopbeam/image/fetch/w_350,h_536,c_pad/ht…nmarcus.com%2Fca%2F1%2Fproduct_assets%2FT%2F7%2FG%2FF%2F9%2FNMT7GF9_mz.jpg"
   },
   "colors":[
      {
         "name":"Silver/shade Mult",
         "imageUrl":"http://images.neimanmarcus.com/ca/1/product_assets/T/7/G/F/9/NMT7GF9_mz.jpg",
         "variants":[
            {
               "id":9033506,
               "color":"Silver/shade Mult",
               "colorFamily":[
                  "silver"
               ],
               "size":"",
               "listPrice":42500,
               "salePrice":21200,
               "images":[
                  {
                     "id":30966526,
                     "url":"http://images.neimanmarcus.com/ca/1/product_assets/T/7/G/F/9/NMT7GF9_mz.jpg"
                  },
                  {
                     "id":30966527,
                     "url":"http://images.neimanmarcus.com/ca/1/product_assets/T/7/G/F/9/NMT7GF9_az.jpg"
                  }
               ]
            }
         ]
      }
   ],
   "apiKey":"bdac27b3-9e03-42b6-93bb-050a9ac01c10",
   "options":{
      "widgetId":"8a15742f-5f5b-42ec-b2d3-675c87715859",
      "productsUrl":"https://www.shopbeamtest.com:4000/v1/products?id=9033506&image=1&apiKey=bdac27b3-9e03-42b6-93bb-050a9ac01c10",
      "initialImageSource":"https://cloudinary-a.akamaihd.net/shopbeam/image/fetch/w_350,h_536,c_pad/ht…nmarcus.com%2Fca%2F1%2Fproduct_assets%2FT%2F7%2FG%2FF%2F9%2FNMT7GF9_mz.jpg"
   }
}
```

#####Out of Stock Example:
```json
{
  "outOfStock": "true",
  "initialProduct": {
    "brandName": "The James Crystal Sailboat Minaudiere",
    "name": ""
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

######In Stock Example:
```json
{
   "outOfStock":false,
   "initialProduct":{
      "id":1883823,
      "name":"The James Crystal Sailboat Minaudiere",
      "description":"<ul><li>Beaded velvet and pleated soft-jersey.</li><b><li>Approx. 67\"L from shoulder to hem. </li></b><li>Round neckline.</li><li>Sleeveless; moderate shoulder coverage.</li><li>Velvet bodice; cutaway.</li><li>Scoop back; zip.</li><li>Hi-low hem.</li><li>Polyester; polyester/spandex; polyester lining.</li><li>Imported.</li></ul><b>About Laundry by Shelli Segal:</b><br/><br/> Fall 2008 announced the return to the Laundry by Shelli Segal name with its Los Angeles based heritage of dressing the Contemporary girl in sexy, on-trend dresses, taking her from work to play. Whether business cocktail or dinner date, baby shower or bridal party, the label offers the perfect dress for every occasion.<br/> Launched in 1988, the collection is a reflection of the \"LA Girl\" - feminine and contemporary with an energetic and free-spirited attitude, always craving the next fashion statement. Every season Laundry by Shelli Segal interprets the latest trends, adding a unique styling to create a signature look.Modern Size Guide",
      "minPrice":21200,
      "maxPrice":21200,
      "maxListPrice":42500,
      "minListPrice":42500,
      "salePercent":50,
      "partnerId":33955,
      "partnerCommission":840,
      "partnerName":"Neiman Marcus",
      "brandId":126295,
      "brandName":"Laundry By Shelli Segal",
      "colorSubstitute":null,
      "createdAt":"2014-07-01T06:03:03.730Z",
      "categories":[
         {
            "id":42848,
            "name":"Evening"
         }
      ],
      "variants":[
         {
            "id":9033506,
            "color":"Silver/shade Mult",
            "colorFamily":[
               "silver"
            ],
            "size":"",
            "listPrice":42500,
            "salePrice":21200,
            "images":[
               {
                  "id":30966526,
                  "url":"http://images.neimanmarcus.com/ca/1/product_assets/T/7/G/F/9/NMT7GF9_mz.jpg"
               },
               {
                  "id":30966527,
                  "url":"http://images.neimanmarcus.com/ca/1/product_assets/T/7/G/F/9/NMT7GF9_az.jpg"
               }
            ]
         }
      ]
   },
   "initialVariant":{
      "id":9033506,
      "color":"Silver/shade Mult",
      "colorFamily":[
         "silver"
      ],
      "size":"",
      "listPrice":42500,
      "salePrice":21200,
      "images":[
         {
            "id":30966526,
            "url":"http://images.neimanmarcus.com/ca/1/product_assets/T/7/G/F/9/NMT7GF9_mz.jpg"
         },
         {
            "id":30966527,
            "url":"http://images.neimanmarcus.com/ca/1/product_assets/T/7/G/F/9/NMT7GF9_az.jpg"
         }
      ]
   },
   "initialImage":{
      "id":30966526,
      "url":"http://images.neimanmarcus.com/ca/1/product_assets/T/7/G/F/9/NMT7GF9_mz.jpg"
   },
   "embedImage":{
      "url":"https://cloudinary-a.akamaihd.net/shopbeam/image/fetch/w_350,h_536,c_pad/ht…nmarcus.com%2Fca%2F1%2Fproduct_assets%2FT%2F7%2FG%2FF%2F9%2FNMT7GF9_mz.jpg"
   },
   "colors":[
      {
         "name":"Silver/shade Mult",
         "imageUrl":"http://images.neimanmarcus.com/ca/1/product_assets/T/7/G/F/9/NMT7GF9_mz.jpg",
         "variants":[
            {
               "id":9033506,
               "color":"Silver/shade Mult",
               "colorFamily":[
                  "silver"
               ],
               "size":"",
               "listPrice":42500,
               "salePrice":21200,
               "images":[
                  {
                     "id":30966526,
                     "url":"http://images.neimanmarcus.com/ca/1/product_assets/T/7/G/F/9/NMT7GF9_mz.jpg"
                  },
                  {
                     "id":30966527,
                     "url":"http://images.neimanmarcus.com/ca/1/product_assets/T/7/G/F/9/NMT7GF9_az.jpg"
                  }
               ]
            }
         ]
      }
   ],
   "apiKey":"bdac27b3-9e03-42b6-93bb-050a9ac01c10",
   "options":{
      "widgetId":"8a15742f-5f5b-42ec-b2d3-675c87715859",
      "productsUrl":"https://www.shopbeamtest.com:4000/v1/products?id=9033506&image=1&apiKey=bdac27b3-9e03-42b6-93bb-050a9ac01c10",
      "initialImageSource":"https://cloudinary-a.akamaihd.net/shopbeam/image/fetch/w_350,h_536,c_pad/ht…nmarcus.com%2Fca%2F1%2Fproduct_assets%2FT%2F7%2FG%2FF%2F9%2FNMT7GF9_mz.jpg"
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

###TO DO: PASTE CODE GENERATION FROM THE DASHBOARD
