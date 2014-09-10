Shopbeam Flash Multi Widget Example
====================

Overview
-----

Shopbeam provides tools for advertisers and publishers to create and serve display advertisements which when clicked or hovered over load product detail panels on-site which can be used to add items to a universal cart and purchase them without leaving the host website.

The Shopbeam 'widget' is the element that is embedded onto the hosting site's page or served over an ad network which the user can interact with to begin their on-site shopping experience. The Shopbeam widget can be either an html image made active with javascript or a flash swf.The instructions below are for creating and embedding a flash swf Shopbeam widget.

Usage
-----

There are two ways to make that your flash advertisements react to user click loading Shopbeam products detail panel.

1) Linking MovieClips to Shopbeam products
-----

In "YourDocumentClass" file, instantiate the Shopbeam class with your API key.

```
    import com.shopbeam.*;

    public class YourDocumentClass extends MovieClip {

        public function YourDocumentClass() { 
          super();
         
          var shopbeam:Shopbeam = new Shopbeam("YOUR-API-KEY", this);
         
          shopbeam.onClickGoToProduct("movieClip1", "product1-id"); /* movieClip1 is the name of a Movie Clip in your flash AD
                                                                       and product1-id is the ID of a Shopbeam product */

          shopbeam.onClickGoToProduct("movieClip2", "product2-id");

      }
  }
```

You can find com.shopbeam library into the examples on this repo.

As we see above, in order to link MovieClips to ShopBeam products, simply create the MovieClips in your stage using Flash, and give they instance names (for the example above: MovieClip1, MovieClip2). Then search into shopbeam.com/products, the IDs of the products you gonna advertise, and give to each "onClickGoToProduct" method the name you gave to the MovieClip, and the Product ID. And that's it!

Note: To find Shopbeam Product ID, you can open the product detail on shopbeam.com/products, click the Text Link tab, copy the code and paste into a text editor, then look for the product id: 

```
data-shopbeam-url="/v1/products?id=9184101 ...
```


On the hosting page just embed an object as following:

```
  <script class="shopbeam-script" type="text/javascript" src="https://www.shopbeam.com/js/widget.loader.js" async="true"></script>
  <object type="application/x-shockwave-flash" data="swfname.swf"
    id="shopbeam-widget-swf-unbootstrapped-UUID"
    width="403" height="253">
    <param name="movie" value="swfname.swf"/>
    <param name="FlashVars" value="widgetUuid=UUID"/>
    <param name="allowscriptaccess" value="always"/>
  </object>

```


2) Loading products from the Embed attributes
-----

Put comma separated urls to our API for each product in the attr ``data-shopbeam-url` as shown below.


```
    <object type="application/x-shockwave-flash" data="swfname.swf"
      id="shopbeam-widget-swf-unbootstrapped-"
      data-image-src="https://cloudinary-a.akamaihd.net/shopbeam/image/fetch/w_300,h_600,c_pad/https%3A%2F%2Fs3.amazonaws.com%2Fsb-photos%2F15430%2F0f450aa8-f79a-479f-aaee-cbfcb381e371-af14616ba9d74f4aa2121ee8efba0dfa.png"
      data-shopbeam-url="/v1/products?id=9009644&image=1&apiKey=<API-KEY>,/v1/products?id=9009643&image=1&apiKey=<API-KEY>,/v1/products?id=9009639&image=1&apiKey=<API-KEY>" width="900"
      height="600">
      <param name="movie" value="swfname.swf"/>
      <!--NOTE: the "value" of FlashVars MUST be urlEncoded!!!-->
      <param name="FlashVars"
        value="frameless=true&widgetUuid=<WidgetUUID>&imageUrl=https%3A%2F%2Fcloudinary-a.akamaihd.net%2Fshopbeam%2Fimage%2Ffetch%2Fw_300%2Ch_600%2Cc_fill%2Fhttps%253A%252F%252Fs3.amazonaws.com%252Fsb-photos%252F15430%252F0f450aa8-f79a-479f-aaee-cbfcb381e371-af14616ba9d74f4aa2121ee8efba0dfa.png"/>
      <param name="allowscriptaccess" value="always"/>
    </object>
```

Afterwards, in your AS code, simply do:

```
    shopbeam.loadProductsFromWidgetEmbed();
```
instead of call shopbeam.onClickGoToProduct method.

This will create clickable areas for each comma separated value.

![Example clickable area](http://imgur.com/NxkuZxp.png "Example clickable area")

Important
-----

Do not use both methods at the same time, as this would result in MovieClips overlapping.
