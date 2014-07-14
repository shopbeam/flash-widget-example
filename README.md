Shopbeam AdShops Flash Widget Example
====================

The Shopbeam AdShops product provides tools for advertisers and publishers to create and serve display advertisements which when clicked or hovered over load product detail panels on-site which can be used to add items to a universal cart and purchase them without ever leaving the host website.

The Shopbeam ‘widget’ is the element that is embedded onto the hosting site’s page or served over an ad network which the user can then interact with to begin their on-site shopping experience. The Shopbeam widget can be either an html image or a flash swf. The instructions below are for creating and embedding a flash swf Shopbeam widget.

The working demo for this overview can be found here: [Demo Page](http://shopbeam.github.io/flash-widget-example/demo/public/)

Usage
-----

### 1. Choose a product

Login to https://www.shopbeam.com/products and select a product. Please use the credentials:

Email: widgetExample@shopbeam.com  
Password: widgetExample

Copy the widget pastecode, it should look like this:

``` html
<script class="shopbeam-script" type="text/javascript" src="https://www.shopbeam.com/js/widget.loader.js" async="true">
</script>
<img class="nopin"
  src="https://cloudinary-a.akamaihd.net/shopbeam/image/fetch/w_150/http%3A%2F%2Fwww.pinksandgreens.com%2Fmedia%2Fcatalog%2Fproduct%2Fcache%2F21%2Fthumbnail%2F700x1052%2F9df78eab33525d08d6e5fb8d27136e95%2Fp%2Fo%2Fpolo2_1.jpg"
  width="150" height="225"
  alt="Greg Norman - Rock&Roll Plaid Short"
  id="shopbeam-widget-image-placeholder-f8ff0042-562c-405e-94e3-ee5749e09b93"
  data-shopbeam-url="/v1/products?id=9042943&image=1&apiKey=a55a93e4-7c95-4a87-9e36-20055bc335d1" />
```

### 2. Embed swf widget

In order to create our own custom flash widget, we just need to grab a few atributes:
- img width and height attributes
- img id attribute
- img src (product image url) attribute
- img data-shopbeam-url attribute

And use them in a flash object embed, here's an example for the provided example swf widget:

``` html
<script class="shopbeam-script" type="text/javascript" src="https://www.shopbeam.com/js/widget.loader.js" async="true">
</script>
<object type="application/x-shockwave-flash" data="shopbeam-widget.swf"
  id="shopbeam-widget-swf-unbootstrapped-f8ff0042-562c-405e-94e3-ee5749e09b93"
  data-shopbeam-url="/v1/products?id=9042943&image=1&apiKey=a55a93e4-7c95-4a87-9e36-20055bc335d1"
  width="150" height="225">
  <param name="movie" value="shopbeam-widget.swf"/>
  <!--NOTE: the "value" of FlashVars MUST be urlEncoded!!!-->
  <param name="FlashVars" value="widgetUuid=f8ff0042-562c-405e-94e3-ee5749e09b93&imageUrl=https://cloudinary-a.akamaihd.net/shopbeam/image/fetch/w_150/http%3A%2F%2Fwww.pinksandgreens.com%2Fmedia%2Fcatalog%2Fproduct%2Fcache%2F21%2Fthumbnail%2F700x1052%2F9df78eab33525d08d6e5fb8d27136e95%2Fp%2Fo%2Fpolo2_1.jpg"/>
  <param name="allowscriptaccess" value="always"/>
</object>
```

on the object tag:
- data: url to the compiled swf widget
- id: "shopbeam-widget-swf-unbootstrapped-" + the product uuid, analogous to the img id above
- `data-shopbeam-url` same value as on the img element
- `width` and `height`: same value as on the img element
- `FlashVars`: this are the parameters for the flash widget (encoded as url query parameters):
 - `widgetUuid`: the uuid copied from the img element id above
 - `imageUrl`: image url (src) on the img element above

Here's a template version of the flash embed:

``` html
<script class="shopbeam-script" type="text/javascript" src="https://www.shopbeam.com/js/widget.loader.js" async="true">
</script>
<object type="application/x-shockwave-flash" data="<!-- url for widget swf -->"
  id="shopbeam-widget-swf-unbootstrapped-<!-- widget uuid (must be UNIQUE! ) -->"
  data-shopbeam-url="<!-- shopbeam product api path (EXCLUDES protocol, port and domain) -->"
  width="<!-- width in pixels (number) -->" height="<!-- height in pixels (number) -->">
  <param name="movie" value="<!-- url for widget swf -->"/>
  <!--NOTE: the "value" of FlashVars MUST be urlEncoded!!!-->
  <param name="FlashVars" value="widgetUuid=<!-- widget uuid (must be UNIQUE! ) -->&imageUrl=<!-- image url -->"/>
  <param name="allowscriptaccess" value="always"/>
</object>
```

#### Image Transformations

The provided image url parameter has sizing parameters that you can modify to obtain the product image for different sizes, in the provided example you can find this part of the url ```/image/fetch/w_150/``` and modify it with these optional parameters:

- ```w_<image width in pixels>```
- ```h_<image height in pixels>```
- ```c_<cropping mode>``` (eg: scale, fit, fill)

For example: ```/image/fetch/w_300,h_600,c_fill/``` (width 300px, height 600px, cropping mode: fill)

You can find more details about cloudinary image transformations [here](http://cloudinary.com/documentation/image_transformations)

### 3. Create a custom swf widget

In order to create a custom ui widget you need communicate with Shopbeam Lightbox in the top window document, to do so from Flash, you need to invoke the Shopbeam js API from ActionScript.

``` actionscript
   // obtained from the pastecode on https://www.shopbeam.com/products
   var widgetUuid = 'f8ff0042-562c-405e-94e3-ee5749e09b93';
   // on click, open the Shopbeam lightbox with this product
   ExternalInterface.call('Shopbeam.swfOpenLightbox', widgetUuid);
```

This will open a Shopbeam lightbox with the product details, giving the user the option to select variants and add to cart.

To check a full example open [shopbeam-widget.fla](shopbeam-widget.fla), actionscript code is in [ShopbeamWidget.as](ShopbeamWidget.as)

To see this working, check the [live demo page](http://shopbeam.github.io/flash-widget-example/demo/public/)

#### 4. Using Product Widget Data:

In order to display product information provided by shopbeam in the custom widget, an actionscript callback will be invoked providing detailed information about the specific product.

``` actionscript
ExternalInterface.addCallback('setWidgetData', function setWidgetData(data: Object): void {
  widgetData = data;
});
```

This allows you to obtain information like product description, price and stock availability.
Here are some examples of the data received:

##### In Stock Example:
```javascript
{
   "outOfStock": false, //boolean: true when the embedded product's variants are out of stock
   "initialProduct": { //object: the embedded variant's* product
      "id": 1883823, //integer: product id
      "name": "The James Crystal Sailboat Minaudiere", //string: product name
      "description": "<ul><li>Beaded velvet and pleated soft-jersey.</li><b><li>Approx. 67\"L from shoulder to hem. </li></b><li>Round neckline.</li><li>Sleeveless; moderate shoulder coverage.</li><li>Velvet bodice; cutaway.</li><li>Scoop back; zip.</li><li>Hi-low hem.</li><li>Polyester; polyester/spandex; polyester lining.</li><li>Imported.</li></ul><b>About Laundry by Shelli Segal:</b><br/><br/> Fall 2008 announced the return to the Laundry by Shelli Segal name with its Los Angeles based heritage of dressing the Contemporary girl in sexy, on-trend dresses, taking her from work to play. Whether business cocktail or dinner date, baby shower or bridal party, the label offers the perfect dress for every occasion.<br/> Launched in 1988, the collection is a reflection of the \"LA Girl\" - feminine and contemporary with an energetic and free-spirited attitude, always craving the next fashion statement. Every season Laundry by Shelli Segal interprets the latest trends, adding a unique styling to create a signature look.Modern Size Guide", //string: html, product description
      "minPrice": 21200, //integer: minimum price (across all variants) in cents
      "maxPrice": 21200, //integer: maximum price (across all variants) in cents
      "maxListPrice": 42500, //integer: maximum list price in cents
      "minListPrice": 42500, //integer: minimum list price in cents
      "salePercent": 50, //integer: sale percentage (if the product is in sale)
      "partnerId": 33955, //integer
      "partnerCommission": 840,
      "partnerName": "Neiman Marcus", //string: partner name
      "brandId": 126295, //integer: brand id
      "brandName": "Laundry By Shelli Segal", //string: brand name
      "colorSubstitute": null, //string: type of variants when colors don't apply, example values: Flavor, Scent, Utensil, Fabric
      "createdAt": "2014-07-01T06:03:03.730Z", //string: timestamp, date & time product was first added to database
      "categories": [ //array: categories the product belongs to
         { //object: category
            "id": 42848, //integer: category id
            "name": "Evening" //string: category name
         }
         //[, ...]
      ],
      "variants": [ //array: variants of product (i.e. all permutations of color / size for a given product)
         { //object: variant
            "id": 9033506, //integer: variant id
            "color": "Silver/shade Mult", //string: color name
            "colorFamily": [ // array of color families for this variant, used for search purposes
               "silver" //string
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
      "color": "Silver/shade Mult", //string: color name
      "colorFamily": [ // array of color families for this variant, used for search purposes
         "silver" //string
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
         "name": "Silver/shade Mult", //string: color name
         "imageUrl": "http://images.neimanmarcus.com/ca/1/product_assets/T/7/G/F/9/NMT7GF9_mz.jpg", //string: url for representitive variant image for given color of the product (usually a variant's first image will be representative of it's color)
         "variants":[ //array: variants that have the given color (this data is duplicated from the variants array but array elements are filtered based on color)
            {
               "id": 9033506, //integer: variant id
               "color": "Silver/shade Mult", //string: color name
               "colorFamily": [ // array of color families for this variant, used for search purposes
                  "silver" //string
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

##### Out of Stock Example:

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
