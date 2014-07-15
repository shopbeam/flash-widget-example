Shopbeam Flash Widget Example
====================

Overview
-----

Shopbeam provides tools for advertisers and publishers to create and serve display advertisements which when clicked or hovered over load product detail panels on-site which can be used to add items to a universal cart and purchase them without leaving the host website.

The Shopbeam ‘widget’ is the element that is embedded onto the hosting site’s page or served over an ad network which the user can interact with to begin their on-site shopping experience. The Shopbeam widget can be either an html image or a flash swf. The instructions below are for creating and embedding a flash swf Shopbeam widget.

The working demo for this example can be found here: [Demo Page](http://shopbeam.github.io/flash-widget-example/demo/public/)

Usage
-----

There are currently two methods available to embed a Shopbeam flash swf widget. One is to use our sample swf which uses product data added to the the embed html, the other is to publish your own swf using the the Adobe Flash Professional application and actionscript code referenced below. 


### 1.  Embed Method One - Using the Shopbeam Sample .swf

First, download the [Shopbeam Widget Sample Swf](https://github.com/shopbeam/flash-widget-example/blob/master/single-variant.swf?raw=true).

Then login to https://www.shopbeam.com/products and select a product. Please use the credentials:

Email: widgetExample@shopbeam.com  
Password: widgetExample

After clicking on a product in the list, you can copy the 'widget pastecode' in your clipboard by clicking the orange 'copy' button on the lower right corner of the product detail window. The widget pastecode should look like this:

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

In order to embed a flash swf widget, we want to grab these four attributes from the image widget pastecode:

- img width and height attributes
- img id attribute
- img src (product image url) attribute
- img data-shopbeam-url attribute

We then want to add these attributes to a flash embed object tag, here's the code we are using for the example swf widget on our [Demo Page](http://shopbeam.github.io/flash-widget-example/demo/public/):

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

Required attributes on the object tag:
- data: url to the compiled swf widget
- id: "shopbeam-widget-swf-unbootstrapped-" + the product uuid, analogous to the img id above
- `data-shopbeam-url` same value as on the img element
- `width` and `height`: same value as on the img element
- `FlashVars`: this are the parameters for the flash widget (encoded as url query parameters):
 - `widgetUuid`: the uuid copied from the img element id above
 - `imageUrl`: image url (src) on the img element above

Here's a template version of the flash embed which has placeholders for the required values:

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

Reference the [Shopbeam Widget Sample Swf](https://github.com/shopbeam/flash-widget-example/blob/master/single-variant.swf?raw=true) file on the environment your newly written html embed code is located, and you should have yourself a shoppable swf. 

The [demo page is here](http://shopbeam.github.io/flash-widget-example/demo/public/) for reference. 


### 2.  Embed Method Two - Custom Flash .swf 

In order to create a custom ui widget you need communicate with Shopbeam Lightbox in the top window document, to do so from Flash, you need to invoke the Shopbeam js API from ActionScript.

``` actionscript
   // obtained from the pastecode on https://www.shopbeam.com/products
   var widgetUuid = 'f8ff0042-562c-405e-94e3-ee5749e09b93';
   // on click, open the Shopbeam lightbox with this product
   ExternalInterface.call('Shopbeam.swfOpenLightbox', widgetUuid);
```

This will open a Shopbeam lightbox with the product details, giving the user the option to select variants and add to cart.

To check a full example open download the [sample files](https://github.com/shopbeam/flash-widget-example/raw/master/shopbeam-flash-widget-source-files.zip) which contain the [shopbeam-widget.fla](shopbeam-widget.fla) and actionscript code file [ShopbeamWidget.as](ShopbeamWidget.as)

To see this working, check the [live demo page](http://shopbeam.github.io/flash-widget-example/demo/public/)

#### Using Product Widget Data:

In order to display product information provided by shopbeam in the custom widget, an actionscript callback will be invoked providing detailed information about the specific product.

``` actionscript
ExternalInterface.addCallback('setWidgetData', function setWidgetData(data: Object): void {
  widgetData = data;
});
```

This allows you to obtain information like product description, price and stock availability.




