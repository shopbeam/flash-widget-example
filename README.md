Flash-Widget-Example -- DOCUMENTATION WIP
====================

This is an example of a flash swf Shopbeam widget app. It's analogous to the angular (html5/javascript) widget app; both of which communicate with the same Shopbeam lightbox, cart and checkout apps in the Shopbeam suite.

Using Shopbeam's Flash Widget:
------------------------------

To use Shopbeam's flash widget app please [visit the widget paste-code generator](#). This generator will output valid, paste-ready html including unique wiget uuids.


Using a Custom Flash Widget:
----------------------------

###Markup Template
_NOTE: All `uuid`s must be unique (on a per widget basis) and conform to the [uuid spec](http://en.wikipedia.org/wiki/Universally_unique_identifier), if it does not, an error will be raised when attampting to checkout with a product added from the malormed widget_

```html
<object type="application/x-shockwave-flash" data="<!-- url for widget swf -->" 
    id="shopbeam-widget-swf-unbootstrapped-<!-- widget uuid (must be UNIQUE!) -->" data-image-src="<!-- url for widget embed image -->" 
    data-shopbeam-url="<!-- shopbeam product api path (excludes protocol, port and domain) -->" 
    width="<!-- width in pixels (number) -->" height="<!-- height in pixels (number) -->">
  <param name="movie" value="<!-- url for widget swf -->"/>
  <!--NOTE: the "value" of FlashVars MUST be urlEncoded!!!-->
  <param name="FlashVars" value="widgetUuid=<!-- widget uuid (must be UNIQUE!) -->"/>
  <param name="allowscriptaccess" value="always"/>
</object>
```

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

_NOTE*: the phrase "embedded variant" refers to the variant whose `id` is in the query to the shopbeam api; e.g. for api url `/v1/products?id=123456`, the embedded variant's id is `123456`. For more info referene the [Shobeam API docs](#)_

_NOTE**: the phrase "embedded image" refers to the image selected at the time of paste-code generation. This could either be one of the embedded variant's* images or an uploaded image_

```actionscript
var widgetData:Object;

ExternalInterface.addCallback('setWidgetData', setWidgetData);
function setWidgetData(data:String):void {
	widgetData = JSON.parse(data);
	loader.load(new URLRequest(widgetData.embedImage.url));
}
```

#####Wiget Data:

######In Stock Example:
```javascript
{
   "outOfStock": false, //boolean: true when the embedded product's variants are out of stock
   "initialProduct": { //object: the embedded variant's* product
      "id": 1883823, //integer: product id
      "name": "The James Crystal Sailboat Minaudiere", //string: product name
      "description": "<ul><li>Beaded velvet and pleated soft-jersey.</li><b><li>Approx. 67\"L from shoulder to hem. </li></b><li>Round neckline.</li><li>Sleeveless; moderate shoulder coverage.</li><li>Velvet bodice; cutaway.</li><li>Scoop back; zip.</li><li>Hi-low hem.</li><li>Polyester; polyester/spandex; polyester lining.</li><li>Imported.</li></ul><b>About Laundry by Shelli Segal:</b><br/><br/> Fall 2008 announced the return to the Laundry by Shelli Segal name with its Los Angeles based heritage of dressing the Contemporary girl in sexy, on-trend dresses, taking her from work to play. Whether business cocktail or dinner date, baby shower or bridal party, the label offers the perfect dress for every occasion.<br/> Launched in 1988, the collection is a reflection of the \"LA Girl\" - feminine and contemporary with an energetic and free-spirited attitude, always craving the next fashion statement. Every season Laundry by Shelli Segal interprets the latest trends, adding a unique styling to create a signature look.Modern Size Guide", //string: html, product description
      "minPrice": 21200, //integer: not sure ... in cents
      "maxPrice": 21200, //integer: not sure ... in cents
      "maxListPrice": 42500, //integer: maximum list price in cents
      "minListPrice": 42500, //integer: minimum list price in cents
      "salePercent": 50, //integer: not sure ... in cents
      "partnerId": 33955, //integer
      "partnerCommission": 840,
      "partnerName": "Neiman Marcus", //string: partner name
      "brandId": 126295, //integer: brand id
      "brandName": "Laundry By Shelli Segal", //string: brand name
      "colorSubstitute": null, //string: not sure
      "createdAt": "2014-07-01T06:03:03.730Z", //string: timestamp, date & time product was first added to database
      "categories": [ //array: (normalized? not sure) categories the product belongs to
         { //object: category
            "id": 42848, //integer: category id
            "name": "Evening" //string: category name
         }
         //[, ...]
      ],
      "variants": [ //array: variants of product (i.e. all permutations of color / size for a given product)
         { //object: variant
            "id": 9033506, //integer: variant id
            "color": "Silver/shade Mult", //string: color name (non-standard, normalized? not sure)
            "colorFamily": [ //array: not sure
               "silver" //string: not sure
               //[, ...]
            ],
            "size": "", //string: size (non-standard)
            "listPrice": 42500, //integer: list price in cents
            "salePrice": 21200, //integer: sale price in cents (if there's no sale, this is identical to listPrice)
            "images": [ //array: images of variant
               { //object: image
                  "id": 30966526, //integer: image id
                  "url": "http://images.neimanmarcus.com/ca/1/product_assets/T/7/G/F/9/NMT7GF9_mz.jpg" //string: image url
               }
               //[, ...]
            ]
         }
      ]
   },
   "initialVariant": { //object: embedded variant* (this is variant's data is duplicated in `initialProduct.variants[n]`; `n` isn't specified anywhere in this dataset)
      "id": 9033506, //integer: variant id
      "color": "Silver/shade Mult", //string: color name (non-standard, normalized? not sure)
      "colorFamily": [ //array: not sure
         "silver" //string: not sure
         //[, ...]
      ],
      "size": "", //string: size (non-standard)
      "listPrice": 42500, //integer: list price in cents
      "salePrice": 21200, //integer: sale price in cents (if there's no sale, this is identical to listPrice)
      "images": [ //array: images of variant
      	{ //object: image
          "id": 30966526, //integer: image id
          "url": "http://images.neimanmarcus.com/ca/1/product_assets/T/7/G/F/9/NMT7GF9_mz.jpg" //string: image url
        }
        //[, ...]
      ]
   },
   "initialImage": { //object: embedded variant's* first image (i.e. `initialVariant.images[0]`) OR embedded image** if `outOfStock` is true
      "id": 30966526, //integer: image id
      "url": "http://images.neimanmarcus.com/ca/1/product_assets/T/7/G/F/9/NMT7GF9_mz.jpg" //string: image url
   },
   "embedImage": { //object: embedded image** (using cloudinary CDN; this includes sizing and cropping)
      "url": "https://cloudinary-a.akamaihd.net/shopbeam/image/fetch/w_350,h_536,c_pad/ht…nmarcus.com%2Fca%2F1%2Fproduct_assets%2FT%2F7%2FG%2FF%2F9%2FNMT7GF9_mz.jpg" //string: image url
   },
   "colors": [ //array: in-stock colors for the product
      {
         "name": "Silver/shade Mult", //string: color name (non-standard, normalize? not sure)
         "imageUrl": "http://images.neimanmarcus.com/ca/1/product_assets/T/7/G/F/9/NMT7GF9_mz.jpg", //string: url for representitive variant image for given color of the product (usually a variant's first image will be representative of it's color)
         "variants":[ //array: variants that have the given color (this data is duplicated from the variants array but array elements are filtered based on color)
            {
               "id": 9033506, //integer: variant id
               "color": "Silver/shade Mult", //string: color name (non-standard, normalized? not sure)
               "colorFamily": [ //array: not sure
                  "silver" //string: not sure
                  //[, ...]
               ],
               "size": "", //string: size (non-standard)
               "listPrice": 42500, //integer: list price in cents
               "salePrice": 21200, //integer: 
               "images": [ //array: images of variant
                  { //object: image
                     "id": 30966526, //integer: image id
                     "url": "http://images.neimanmarcus.com/ca/1/product_assets/T/7/G/F/9/NMT7GF9_mz.jpg" //string: image url
                  }
                  //[, ...]
               ]
            }
         ]
      }
   ],
   "apiKey": "bdac27b3-9e03-42b6-93bb-050a9ac01c10", //string: publisher api key
   "options": { //object: additional (optional / misc.) data
      "widgetId": "8a15742f-5f5b-42ec-b2d3-675c87715859", //string: widget uuid
      "productsUrl": "https://www.shopbeamtest.com:4000/v1/products?id=9033506&image=1&apiKey=bdac27b3-9e03-42b6-93bb-050a9ac01c10", //string: shopbeam api url used to get this data
      "initialImageSource": "https://cloudinary-a.akamaihd.net/shopbeam/image/fetch/w_350,h_536,c_pad/ht…nmarcus.com%2Fca%2F1%2Fproduct_assets%2FT%2F7%2FG%2FF%2F9%2FNMT7GF9_mz.jpg" //string: image url from `data-image-src` attribute
   }
}
```

######Out of Stock Example:
```javascript
{
   "outOfStock": true, //boolean: true when the embedded product's variants are out of stock
   "initialProduct": { //object: placeholder object for out of stock product
      "brandName": "Currently Out of Stock", //string: placeholder text
      "name": "(all colors & sizes)" //string: placeholder text
   },
   "initialImage": { //object: embedded image**
      "url": "https://cloudinary-a.akamaihd.net/shopbeam/image/fetch/w_494,h_800,c_pad,r_…nger22.com%2Fstatic%2Finsets%2Fimages%2FNEVER1031-SHOCKING-PINK_INSET5.jpg" //string: image url
   },
   "embedImage": { //object: embedded image** (using cloudinary CDN; this includes sizing and cropping)
      "url": "https://cloudinary-a.akamaihd.net/shopbeam/image/fetch/w_494,h_800,c_pad,r_…nger22.com%2Fstatic%2Finsets%2Fimages%2FNEVER1031-SHOCKING-PINK_INSET5.jpg" //string: image url
   },
   "apiKey": "e8abf83f-38f2-450b-80e5-32d206ce85e6", //string: publisher api key
   "options": { //object: additional (optional / misc.) data
      "widgetId": "738f4922-2870-4e11-9d40-f0556c9855cf", //string: widget uuid
      "productsUrl": "https://www.shopbeamtest.com:4000/v1/products?id=7834&apiKey=e8abf83f-38f2-450b-80e5-32d206ce85e6&google_conversion_id=978821477&campaign=nieman", //string: shopbeam api url used to get this data
      "initialImageSource": "https://cloudinary-a.akamaihd.net/shopbeam/image/fetch/w_494,h_800,c_pad,r_…nger22.com%2Fstatic%2Finsets%2Fimages%2FNEVER1031-SHOCKING-PINK_INSET5.jpg", //string: image url from `data-image-src` attribute
   }
}
```


###TO DO: PASTE CODE GENERATION FROM THE DASHBOARD
not
