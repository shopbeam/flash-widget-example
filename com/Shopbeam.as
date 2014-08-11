﻿package com {
	import flash.display.*;
	import flash.display.Stage;
	import flash.events.*;
	import flash.net.*;
	import flash.utils.*;
	import flash.media.*;
	import flash.external.*;
	import flash.system.Security;

	public class Shopbeam {
		public var API_KEY = "e8abf83f-38f2-450b-80e5-32d206ce85e6";
		public const API_URL: String = "https://localhost:4000/v1/products";
		public var main: MovieClip;
		public var stageRef: Stage;
		public var index:Number = 0;
		private var widgetLoader: int = 0;
		public var x_area:Number = 0;

		public function Shopbeam(apiKey: String, mainMc: MovieClip) {
			this.main = mainMc;
			this.API_KEY = apiKey;
			this.x_area = 0;
			log(this.x_area);
			widgetLoaderExists();
		}
		private function widgetLoaderExists(): void {
			var exists: * = ExternalInterface.call('eval', 'document.getElementsByClassName("shopbeam-script").length');
			if (exists) {
				widgetLoader = 1;
			} else {
				log("no widget.loader.js");
				widgetLoader = 0;
			}
		}
		private function log(args: * ): void {
			if (ExternalInterface.available) {
				ExternalInterface.call('console.log', arguments.join(' '));
			}
		}
		public function makeMovieClipLinkProduct(mc_name: String, productId: String): Boolean {
			var requestVars: URLVariables = new URLVariables();
			var request: URLRequest = new URLRequest();
			var loader: URLLoader;
			var prodUrl: String = "/v1/products?id=" + productId + "&image=1&apiKey=" + API_KEY;
			var index:Number = this.index;
			
			///v1/products?id=9009644&image=1&apiKey=e8abf83f-38f2-450b-80e5-32d206ce85e6
			
			request.url = API_URL;
			requestVars.apiKey = API_KEY;
			requestVars.image = "1";
			request.method = URLRequestMethod.GET;

			loader = new URLLoader();
			loader.dataFormat = URLLoaderDataFormat.TEXT;
			loader.addEventListener(Event.COMPLETE, function callHandler(e:Event){
					var jsonObject: Object = JSON.parse(e.target.data);
					loaderCompleteHandler(mc_name, jsonObject, prodUrl, index);
				}, false, 0, true);
			this.index += 1;
			requestVars.id = productId;
			request.data = requestVars;
			loader.load(request);

			return true;
		}
		
		public function loaderCompleteHandler(mc_name:String, data:Object, registerProductUrl:String, index:Number): void {
			var mc: MovieClip;
			var i  = index;
			var wl = this.widgetLoader;
			mc = this.main.getChildByName(mc_name) as MovieClip;
			mc.alpha = 0;
			if(wl){
				executeJS("Shopbeam.swfWidgetRegisterProduct('" + main.stage.loaderInfo.parameters.widgetUuid + "', '" + registerProductUrl + "')");
			}
			log(main.stage.loaderInfo.parameters.widgetUuid + " " + registerProductUrl);
			mc.addEventListener(MouseEvent.CLICK, function (e: Event) {
				if(!wl){
					onClickProductArea(data[0].variants[0].sourceUrl);
				} else {
					onClickProductArea(i.toString());
				}
			}, false, 0, true);
		}		
		
		public function linkProductsFromDOM():void{
			var areax:Number = 0;
			ExternalInterface.addCallback('setWidgetData', function setWidgetData(data: String, productData: String): void {				
				var prodData: Object = JSON.parse(productData);
				var dataParse: Object = JSON.parse(data);
				var index: int = prodData.index;
				var area: MovieClip = new MovieClip();
				log(areax);

				var box:Shape = new Shape();
				box.graphics.lineStyle(1);
				box.graphics.beginFill(0x0000FF, 1);
				box.graphics.drawRect(0,0,300,main.stage.stageWidth);
				box.x = 0;
				box.y = 0;
				
				area.addChild(box);
				if(!areax){
					area.x = areax;
					areax += area.width;
				} else {
					area.x = areax;
					areax = area.x + area.width;
				}
				
				area.y = 0;
				this.x_area += area.width;

				area.useHandCursor = true;
				area.buttonMode = true;
				area.addEventListener(MouseEvent.CLICK, function (e:Event){
					log("click");
					onClickProductArea(index.toString());
				});				
				main.stage.addChild(area);
				area.alpha = 0.3;
			});
		}

		public function onClickProductArea(url:String): void {
			log(url);
			if(!ExternalInterface.call('eval', 'document.getElementsByClassName("shopbeam-script").length')){
				navigateToURL(new URLRequest(url), "_blank");
			} else {
				if (main.stage.loaderInfo.parameters.widgetUuid && ExternalInterface.available) {
					executeJS("Shopbeam.swfOpenLightbox('" + main.stage.loaderInfo.parameters.widgetUuid + "', " + url + ")");
				}
			}
		}
		private function executeJS(js): * {
			var wrapped = 'try {\n' + js + '\n}catch(err){console.error(err);console.error(err.stack);}';
			var result: * = null;
			try {
				result = ExternalInterface.call('eval', wrapped);
			} catch (e: Error) {
				trace(e.message);
			}
			return result;
		}		
	}
}