Shopbeam Flash Multi Widget Example
====================

Overview
-----

Shopbeam provides tools for advertisers and publishers to create and serve display advertisements which when clicked or hovered over load product detail panels on-site which can be used to add items to a universal cart and purchase them without leaving the host website.

The Shopbeam 'widget' is the element that is embedded onto the hosting site's page or served over an ad network which the user can interact with to begin their on-site shopping experience. The Shopbeam widget can be either an html image made active with javascript or a flash swf. The instructions below are for creating and embedding a flash swf Shopbeam widget.

Usage
-----

In the Expanded.as file add your product id's to the productIds array, and your api key.

```
public const API_KEY = "YOUR-API-KEY";
public const API_URL:String = "https://www.shopbeam.com/v1/products";
public var productIds: Array = ['9009643', '9009639', '9009644'];
```

How does it work
-----

If the page where the widget is loaded, it's referenced widget.loader.js, the widget will open a lightbox for each product referenced. Otherwise, it will redirect the user to the url of the product.


Clickable area
-----

The flash file has a MovieClip in it's library called "itemArea". For each product id in the productIds array, a clickable area like this is added side by side, that will take you (or open the lightbox in case there's no widget.loader.js) to the proper product.

![Example clickable area](http://imgur.com/NxkuZxp.png "Example clickable area")

In case you want to modify the height and width of the area to be clicked for each product (ItemArea in Flash), you may do so by modifying it from the library:

![Modifying Item Area](http://i.imgur.com/kloAaUv.png)


