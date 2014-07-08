package {
	import flash.system.*;
	import flash.net.*;
	import flash.external.*;
	import flash.display.*;
	import flash.events.*;

	public class ShopbeamWidget extends MovieClip {
		public function ShopbeamWidget() {

			function log(): void {
				ExternalInterface.call('console.log', arguments.join(' '));
			}

			function logError(): void {
				ExternalInterface.call('console.error', arguments.join(' '));
			}
			
			function executeJS(js): void {
				var wrapped = 'try {\n' + js + '\n}catch(err){console.error(err);console.error(err.stack);}';
				ExternalInterface.call('eval', wrapped);
			}

			Security.allowDomain('*');
			//Security.allowDomain('shopbeamtest.com');

			var widgetUuid: String = stage.loaderInfo.parameters.widgetUuid;
			var loader: Loader = new Loader();

			stage.align = StageAlign.TOP_LEFT;
			stage.scaleMode = StageScaleMode.NO_SCALE;

			var button: Sprite = new Sprite();
			button.addChild(loader);
			button.buttonMode = true;
			button.useHandCursor = true;
			addChild(button);

			function loadingError(e: IOErrorEvent): void {
				logError('widget with id: ' + widgetUuid + ' failed to load image');
			}

			loader.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR, loadingError);

			function doneLoad(e: Event): void {
				loader.contentLoaderInfo.removeEventListener(Event.COMPLETE, doneLoad);
				loader.contentLoaderInfo.removeEventListener(IOErrorEvent.IO_ERROR, loadingError);
			}
			loader.contentLoaderInfo.addEventListener(Event.COMPLETE, doneLoad);

			function loaderClickHandler(e: Event): void {
				log('widgetOpenLightbox' + widgetUuid);
				executeJS("Shopbeam.swfOpenLightbox('" + widgetUuid + "')");
			}

			loader.addEventListener(MouseEvent.CLICK, loaderClickHandler);

			log('loading image: ' + stage.loaderInfo.parameters.imageUrl);
			loader.load(new URLRequest(stage.loaderInfo.parameters.imageUrl));
		}
	}
}