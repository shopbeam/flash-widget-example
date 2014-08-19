Shopbeam Flash Multi Widget Example
====================

Overview
-----

Shopbeam provides tools for advertisers and publishers to create and serve display advertisements which when clicked or hovered over load product detail panels on-site which can be used to add items to a universal cart and purchase them without leaving the host website.

The Shopbeam 'widget' is the element that is embedded onto the hosting site's page or served over an ad network which the user can interact with to begin their on-site shopping experience. The Shopbeam widget can be either an html image made active with javascript or a flash swf. The instructions below are for creating and embedding a flash swf Shopbeam widget.

Usage
-----

In "YourDocumentClass" file, instantiate the Shopbeam class with you API key.

```
    import com.Shopbeam;

    public class YourDocumentClass extends MovieClip {

        public function YourDocumentClass() {	
	        super();
	        var shopbeam:Shopbeam = new Shopbeam("YOUR-API-KEY", this);
	        shopbeam.onClickGoToProduct("childName", "9009638");
	    }
	}
```

Linking MovieClips to Shopbeam products
-----

In order to link a MovieClip to a ShopBeam product, simply create a MovieClip in your stage using Flash, and give it an "instance name".

Once you give the name, simply do:

```
    shopbeam.onClickGoToProduct("childName", "9009638");
```

give the method the name you gave to the MovieClip, and a Product ID. And that's it!

Loading products from the Embed attributes
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

This will create clickable areas for each comma separated value.

![Example clickable area](http://imgur.com/NxkuZxp.png "Example clickable area")

Important
-----

Do not use both methods at the same time, as this would result in MovieClips overlapping.
