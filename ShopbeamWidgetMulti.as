package {

import flash.system.*;
import flash.net.*;
import flash.external.*;
import flash.display.*;
import flash.events.*;

import fl.transitions.easing.*;
import fl.transitions.Tween;

import flash.globalization.CurrencyFormatter;
import flash.geom.Rectangle;

public class ShopbeamWidgetMulti extends MovieClip {
	var prod_x:int = 0;
	var index:int;
  public function ShopbeamWidgetMulti() {
    product.brandName.alpha = 0;
    product.productName.alpha = 0;
    product.listPrice.alpha = 0;
    product.salePrice.alpha = 0;

    var SHOP_HERE_TWEEN_X:int = 180;
    var SHOP_HERE_INITIAL_X:int = product.hoverMovie.x;
    var bagActive:Sprite = product.hoverMovie.bagActive;
    var bagInactive:Sprite = product.hoverMovie.bagInactive;

    function tweenTo(object:DisplayObject, property:String, value:*, duration:int = 30, durationInSeconds:Boolean = false):Tween {
      return new Tween(object, property, Strong.easeOut, object[property], value, 30);
    }

    function tweenAlpha(object:DisplayObject, opacity:Number, duration:int = 30, durationInSeconds:Boolean = false):Tween {
      return tweenTo(object, 'alpha', opacity, duration, durationInSeconds);
    }

    function fadeIn(object:DisplayObject, duration:int = 30, durationInSeconds:Boolean = false):void {
      tweenAlpha(object, 1, duration, durationInSeconds)
    }

    function fadeOut(object:DisplayObject, duration:int = 30, durationInSeconds:Boolean = false):void {
      tweenAlpha(object, 0, duration, durationInSeconds)
    }

    product.hoverArea.addEventListener(MouseEvent.MOUSE_OVER, onMouseOver);
	
	function onMouseOver(event:MouseEvent):void {
      fadeIn(event.currentTarget.parent.listPrice);
      if (event.currentTarget.parent.listPrice.text !== product.salePrice.text) {
        fadeIn(event.currentTarget.parent.strikeThrough);
        fadeIn(event.currentTarget.parent.salePrice);
      }

      fadeIn(event.currentTarget.parent.brandName);
      fadeIn(event.currentTarget.parent.productName);
      fadeIn(event.currentTarget.parent.hoverMovie.bagActive);
      fadeOut(event.currentTarget.parent.hoverMovie.bagInactive);
      tweenAlpha(event.currentTarget.parent.backdrop, 0.6);
      tweenTo(event.currentTarget.parent.hoverMovie, 'x', SHOP_HERE_TWEEN_X);		
	}

    product.hoverArea.addEventListener(MouseEvent.MOUSE_OUT, onMouseOut);
	
	
	function onMouseOut(event:MouseEvent):void {
      fadeOut(event.currentTarget.parent.salePrice);
      fadeOut(event.currentTarget.parent.listPrice);
      fadeOut(event.currentTarget.parent.strikeThrough);

      fadeOut(event.currentTarget.parent.brandName);
      fadeOut(event.currentTarget.parent.productName);
      fadeOut(event.currentTarget.parent.hoverMovie.bagActive);
      fadeIn(event.currentTarget.parent.hoverMovie.bagInactive);
      fadeOut(event.currentTarget.parent.backdrop);
      tweenTo(event.currentTarget.parent.hoverMovie, 'x', SHOP_HERE_INITIAL_X);
    };

    function log():void {
      ExternalInterface.call('console.log', arguments.join(' '));
    }

    function logError():void {
      ExternalInterface.call('console.error', arguments.join(' '));
    }

    function executeJS(js):void {
      var wrapped = 'try {\n' + js + '\n}catch(err){console.error(err);console.error(err.stack);}';
      ExternalInterface.call('eval', wrapped);
    }

    Security.allowDomain('*');

    var widgetUuid:String = stage.loaderInfo.parameters.widgetUuid;
    var loader:Loader = new Loader();
    var widgetData:Object;
	var productDat;
	
    ExternalInterface.addCallback('setWidgetData', function setWidgetData(data:String, productData: String):void {
      productDat = JSON.parse(productData);
      index = productDat.index;
	  widgetData = JSON.parse(data);
	  var dollarFormatter:CurrencyFormatter = new CurrencyFormatter('usd');
		  log('swf received data for product index ' + index);
		
	  if(!index){
		  product.brandName.text = widgetData.initialProduct.brandName;
		  product.productName.text = widgetData.initialProduct.name;

		  product.listPrice.text = dollarFormatter.format((widgetData.initialVariant.listPrice / 100), true);
		  //strikeThrough.width ...
		  product.salePrice.text = dollarFormatter.format((widgetData.initialVariant.salePrice / 100), true);
	  } else {
		  log("new prod");
          var spr:Sprite = new Sprite();
		  var ldrImg:Loader = new Loader();
		  ldrImg.load(new URLRequest(widgetData.initialVariant.images[0].url));
		  spr.addChild(ldrImg);
		  spr.name = "image";
		  var prod:MovieClip = new Product();
		  prod.addChild(spr);
		  prod.getChildByName("image").x = 0;
		  prod.getChildByName("image").y = 0;
		  prod.setChildIndex(spr, 0);
		  prod.name = productDat.index;
		  
		  prod_x += 300;
		  prod.brandName.text = widgetData.initialProduct.brandName;
		  prod.productName.text = widgetData.initialProduct.name;

		  prod.listPrice.text = dollarFormatter.format((widgetData.initialVariant.listPrice / 100), true);
		  //strikeThrough.width ...
		  prod.salePrice.text = dollarFormatter.format((widgetData.initialVariant.salePrice / 100), true);
		  prod.hoverArea.addEventListener(MouseEvent.CLICK, loaderClickHandler);
		  prod.hoverArea.addEventListener(MouseEvent.MOUSE_OUT, onMouseOut);
		  prod.hoverArea.addEventListener(MouseEvent.MOUSE_OVER, onMouseOver);
          prod.hoverArea.buttonMode = true;
		  prod.hoverArea.useHandCursor = true;		  
		  prod.x += prod_x;
		  prod.y = 0;
		  addChild(prod);
	  }
    });

	
    var button:Sprite = new Sprite();
    button.addChild(loader);

    //required for `.useHandCursor` to work
    product.hoverArea.buttonMode = true;
    product.hoverArea.useHandCursor = true;
    addChild(button);

    setChildIndex(button, 0);

    function loadingError(e:IOErrorEvent):void {
      logError('widget with id: ' + widgetUuid + ' failed to load image');
    }

    loader.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR, loadingError);

    function doneLoad(e:Event):void {
      loader.contentLoaderInfo.removeEventListener(Event.COMPLETE, doneLoad);
      loader.contentLoaderInfo.removeEventListener(IOErrorEvent.IO_ERROR, loadingError);
    }

    loader.contentLoaderInfo.addEventListener(Event.COMPLETE, doneLoad);

    function loaderClickHandler(e:Event):void {
	  if(e.currentTarget.parent.name == "product"){
		index = 0;
	  }
	  else {
		index = e.currentTarget.parent.name;
	  }
      log('widgetOpenLightbox: ' + widgetUuid + " index: " + index);
      executeJS("Shopbeam.swfOpenLightbox('" + widgetUuid + "', " + index + ")");
    }

    product.hoverArea.addEventListener(MouseEvent.CLICK, loaderClickHandler);

    log('loading image: ' + stage.loaderInfo.parameters.imageUrl);
    loader.load(new URLRequest(stage.loaderInfo.parameters.imageUrl));
  }
}
}
