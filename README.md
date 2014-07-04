Flash-Widget-Example
====================

This is an example of a flash swf Shopbeam widget app. It's analogous to the angular (html5/javascript) widget app; both of which communicate with the same Shopbeam lightbox, cart and checkout apps in the Shopbeam suite.

Markup Template
------

```html
<object type="application/x-shockwave-flash" data="<url for single-widget.swf>" id="shopbeam-widget-swf-unbootstrapped-<widget uuid (must be UNIQUE!)>" data-image-src="<url for widget embed image>" data-shopbeam-url="<shopbeam product api path (excludes protocol, port and domain)>" width="<width in pixels (number)>" height="<height in pixels (number)>">
  <param name="movie" value="<url for single-widget.swf>"/>
  <!--NOTE: the "value" of FlashVars MUST be urlEncoded!!!-->
  <param name="FlashVars" value="widgetUuid=<widget uuid (must be UNIQUE!)>"/>
  <param name="allowscriptaccess" value="always"/>
</object>
```
