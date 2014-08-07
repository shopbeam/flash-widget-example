package com {
	import flash.display.*;
	import flash.events.*;
	import flash.net.*;
	import flash.utils.*;
	import flash.media.*;
	import flash.external.*;
	import flash.system.Security;

	import com.greensock.*;
	import com.greensock.easing.*;

	import com.condenast.ISwf;

	public class Expanded extends MovieClip {
		private var stageW: Number = 970;
		private var stageH: Number = 418;
		private var track: Function;
		private var autoCloseTimer: uint;
		public var item_x: int = 0;
		public const API_KEY = "e8abf83f-38f2-450b-80e5-32d206ce85e6";
		public const API_URL:String = "https://localhost:4000/v1/products"
		public var productIds: Array = ['9009643', '9009639', '9009644'];
		
		public var urlArr: Array = new Array();

		public function Expanded() {
			Security.allowDomain("*");
			try {
				//var swfLocation:String = ExternalInterface.call("window.location.href.toString");
				//if(!swfLocation) _init(function(arg1:*, arg2:*):void{trace('TRACK =', arg1 + ',', arg2)});
			} catch (e: Error) {
				trace(e.message);
			}
			if (widgetLoaderExists()) {
				ExternalInterface.addCallback('setWidgetData', function setWidgetData(data: String, productData: String): void {
					var prodData: Object = JSON.parse(productData);
					var index: int = prodData.index;
					var area: MovieClip = new ItemArea();
					addChild(area);
					area.x = item_x;
					item_x += area.width;
					area.y = 0;
					area.alpha = 0;
					area.name = index.toString();
					area.buttonMode = true;
					area.useHandCursor = true;
					area.addEventListener(MouseEvent.CLICK, onClickProductArea);
				});
			} else {
				var requestVars: URLVariables = new URLVariables();
				var request: URLRequest = new URLRequest();
				var loader: URLLoader;

				request.url = API_URL;
				requestVars.apiKey = API_KEY;
				requestVars.image = "1";
				request.method = URLRequestMethod.GET;

				for each(var id in productIds) {
					loader = new URLLoader();
					loader.dataFormat = URLLoaderDataFormat.TEXT;
					loader.addEventListener(Event.COMPLETE, loaderCompleteHandler);
					requestVars.id = id;
					request.data = requestVars;
					loader.load(request);
				}
			}
			cta_mc.addEventListener(MouseEvent.ROLL_OVER, ctaManager);
			cta_mc.addEventListener(MouseEvent.CLICK, ctaManager);
			_init();
		}
		public function loaderCompleteHandler(e: Event): void {
			var jsonObject: Object = JSON.parse(e.target.data);
			var area: MovieClip = new ItemArea();
			area.useHandCursor = true;
			area.buttonMode = true;
			addChild(area);
			area.x = item_x;
			item_x += area.width;
			area.y = 0;
			area.name = jsonObject[0].variants[0].id.toString();
			urlArr[jsonObject[0].variants[0].id.toString()] = jsonObject[0].variants[0].sourceUrl;
			area.alpha = 0;
			area.addEventListener(MouseEvent.CLICK, onClickProductAreaNoWidget);
		}
		public function onClickProductArea(e: MouseEvent): void {
			var widgetUuid: String = stage.loaderInfo.parameters.widgetUuid;
			if (widgetUuid && ExternalInterface.available) {
				executeJS("Shopbeam.swfOpenLightbox('" + widgetUuid + "', " + e.target.name + ")");
			}
		}
		public function onClickProductAreaNoWidget(e:MouseEvent):void{
			navigateToURL(new URLRequest(urlArr[e.target.name]), "_blank");
		}
		function log(args: * ): void {
			if (ExternalInterface.available) {
				ExternalInterface.call('console.log', arguments.join(' '));
			}
		}
		public function widgetLoaderExists(): int {
			var exists: * = executeJS('Shopbeam.checkLoadedFromSwf()');
			if (exists) {
				return 1;
			} else {
				log("no widget.loader.js");
				return 0;
			}
		}
		public function _init(): void {
			//track = event;

			var bgShape: Shape = new Shape();
			bgShape.graphics.beginFill(0xffffff);
			bgShape.graphics.drawRect(0, 0, stageW, stageH);
			bgShape.graphics.endFill();
			addChildAt(bgShape, 0);

			var gMask: Shape = new Shape();
			gMask.graphics.beginFill(0x000000);
			gMask.graphics.drawRect(0, 0, stageW, stageH);
			gMask.graphics.endFill();
			addChild(gMask);
			this.mask = gMask;

			var border: Shape = new Shape();
			border.graphics.lineStyle(1, 0x333333);
			border.graphics.drawRect(0, 0, stageW - .5, stageH - .5);
			addChild(border);

			cta_mc.buttonMode = true;

			close_mc.buttonMode = true;
			close_mc.addEventListener(MouseEvent.CLICK, closeExpansion);

			logo2_mc.alpha = title2_mc.alpha = title_mc.alpha = 0;;

			// Animation
			stop();

			var del: Number = 0;
			TweenMax.to(collapsed_mc, .5, {
				delay: del,
				alpha: 0
			});

			del += .5;
			TweenMax.from(bg_mc, 1, {
				delay: del,
				height: 66,
				ease: Quad.easeInOut
			});
			TweenMax.from(border, 1, {
				delay: del,
				height: 66,
				ease: Quad.easeInOut
			});
			TweenMax.from(gMask, 1, {
				delay: del,
				height: 66,
				ease: Quad.easeInOut
			});
			TweenMax.to(logo1_mc, 0, {
				delay: del,
				x: logo2_mc.x,
				y: logo2_mc.y,
				scaleX: logo2_mc.scaleX,
				scaleY: logo2_mc.scaleY,
				ease: Quad.easeInOut,
				overwrite: 0
			});
			TweenMax.from(logo1_mc, 1, {
				delay: del,
				alpha: 0,
				overwrite: 0
			});
			TweenMax.to(title1_mc, 1, {
				delay: del,
				x: title2_mc.x,
				y: title2_mc.y,
				scaleX: title2_mc.scaleX,
				scaleY: title2_mc.scaleY,
				ease: Quad.easeInOut
			});

			del += .5;
			TweenMax.from(cta_mc, 1, {
				delay: del,
				alpha: 0
			});

			del += .5;
			TweenMax.from(close_mc, 1, {
				delay: del,
				alpha: 0
			});
			TweenMax.allFrom([state1_mc, state2_mc, state3_mc, state4_mc, state5_mc], .5, {
				delay: del,
				alpha: 0
			}, 1.5);

			del += 7;
			TweenMax.allTo([state1_mc, state2_mc, state3_mc, state4_mc, state5_mc], .5, {
				delay: del,
				alpha: 0
			});
			TweenMax.to(cta_mc, .5, {
				delay: del,
				alpha: 0
			});
			TweenMax.to(logo1_mc, .5, {
				delay: del,
				alpha: 0,
				overwrite: 0
			});
			TweenMax.to(title1_mc, .5, {
				delay: del,
				alpha: 0,
				overwrite: 0
			});

			del += .5;
			TweenMax.from(endFrame_mc, 1, {
				delay: del,
				alpha: 0
			});
			setTimeout(revealEndFrame, del * 1000);

			autoCloseTimer = setTimeout(autoClose, 15000);
		}
		private function revealEndFrame(): void {
			logo_mc.gotoAndPlay('show');
			TweenMax.to(title_mc, .5, {
				delay: .5,
				alpha: 1
			});

		}
		public function ctaManager(event: MouseEvent): void {
			switch (event.type) {
				case 'rollOver':
					cta_mc.gotoAndPlay('shine');
					endFrame_mc.gotoAndPlay('shine');
					break;

				case 'click':
					//track('click', 'learn_more');
					//track('message', 'learn_more');

					//loader.load(request);
					break;
			}
		}
		public function autoClose(): void {
			track('view ', 'auto_close');
			track('message', 'auto_close');
		}
		public function closeExpansion(event: MouseEvent): void {
			track('click', 'user_close');
			track('message', 'user_close');
		}
		public function _catch($e: * ): void {
			if ($e.message.split('http://').length >= 2) {
				track('navigateToURL', $e.message);
			}
		}
		function executeJS(js): * {
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