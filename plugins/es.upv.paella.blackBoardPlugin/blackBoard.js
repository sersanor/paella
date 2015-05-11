Class ("paella.BlackBoard", paella.EventDrivenPlugin,{
	_blackBoardProfile:"s_p_blackboard",
	_overlayContainer:null,
	_blackBoardDIV:null,
	_active:false,
	_creationTimer:500,
	_zImages:null,
	_videoLength:null,
	_keys:null,
	_actualImage:null,
	_next:null,
	_ant:null,
	_lensFrame:null,
	_lensDIV:null,
	_lensContainer:null,
	_lensWidth:90,
	_lensHeight:50,
	_conImg:null,
	_currentZoom:100,
	_maxZoom:250,

	getIndex:function(){return 10;},

	getAlignment:function(){
		return 'right';
	},
	getSubclass:function() { return "blackBoardButton"; },

	getDefaultToolTip:function() { return base.dictionary.translate("BlackBoard");},

	getEvents:function() {
		return[
			paella.events.setProfile,
			paella.events.timeUpdate
		];
    },

    onEvent:function(event, params){
    	var self = this;
    	switch(event){
    		case paella.events.setProfile: if(params.profileName==self._blackBoardProfile){
    											self.createOverlay();
    											self._active = true;
    										} 
    										else{
    											self.destroyOverlay();
    											self._active = false;
    										}
    										break;
    		case paella.events.timeUpdate: if(self._active){self.imageUpdate(event,params);} break;
    	}
    },
	checkEnabled:function(onSuccess) {
		var n = paella.player.videoContainer.sourceData[0].sources;

		if(n.hasOwnProperty("image"))onSuccess(true);
		else onSuccess(false);
	},

	setup:function() {
		var self = this;
		//self._overlayContainer = $("#overlayContainer");
		self._overlayContainer = $("#playerContainer_videoContainer_container");
		self._lensFrame = $("#playerContainer_videoContainer_1");		

				//  BRING THE IMAGE ARRAY TO LOCAL
		self._zImages = {};
		self._zImages = paella.player.videoContainer.sourceData[0].sources.image[0].frames; // COPY TO LOCAL
		self._videoLength = paella.player.videoContainer.sourceData[0].sources.image[0].duration; // video duration in frames

		// SORT KEYS FOR SEARCH CLOSEST
		self._keys = Object.keys(self._zImages);
		self._keys = self._keys.sort(function(a, b){
			a = a.slice(6);
			b = b.slice(6);
			return parseInt(a)-parseInt(b); 
		});

		//NEXT
		this._next = 0;
		this._ant = 0;

		if(paella.player.selectedProfile == self._blackBoardProfile){
			self.createOverlay();
			self._active = true;
		}
	},

	createOverlay:function(){
		var self = this;

		var blackBoardDiv = document.createElement("div");
		blackBoardDiv.className = "blackBoardDiv";
		self._blackBoardDIV = blackBoardDiv;

		var largeDiv = document.createElement("div");
		largeDiv.className = "largeDiv";

		var stDiv = document.createElement("div");
		stDiv.className = "stDiv";

		var ndDiv = document.createElement("div");
		ndDiv.className = "ndDiv";

		
		var mvideoR = paella.player.videoContainer.getMasterVideoRect();
		stDiv.style.top = mvideoR.top+"px";
		stDiv.style.left = mvideoR.left+"px";
		stDiv.style.height = mvideoR.height+"px";
		stDiv.style.width = mvideoR.width+"px";

		var svideoR = paella.player.videoContainer.getSlaveVideoRect();
		ndDiv.style.top = svideoR.top+"px";
		ndDiv.style.left = svideoR.left+"px";
		ndDiv.style.height = svideoR.height+"px";
		ndDiv.style.width = svideoR.width+"px";


		$("#overlayContainer").append(stDiv);
		$("#overlayContainer").append(ndDiv);

		
		$(self._overlayContainer).append(blackBoardDiv);

		// ZOOM
		$(self._blackBoardDIV).bind('wheel mousewheel', function(e){
        var delta;

        if (e.originalEvent.wheelDelta !== undefined)
            delta = e.originalEvent.wheelDelta;
        else
            delta = e.originalEvent.deltaY * -1;

            if(delta > 0 && self._currentZoom<self._maxZoom) {
            	self._currentZoom += 10; 
            }
            else if(self._currentZoom>100){
                self._currentZoom -= 10; 
            }
            self._blackBoardDIV.style.backgroundSize = (self._currentZoom)+"%";
        });
		


	},

	destroyOverlay:function(){
		var self = this;

		if(self._blackBoardDIV){
			$(self._blackBoardDIV).remove();
		}
	},

	imageUpdate:function(event,params) {

			var self = this;
			var sec = Math.round(params.currentTime);
			var src = $(self._blackBoardDIV).css('background-image');

			if($(self._blackBoardDIV).length>0){

				if(self._zImages.hasOwnProperty("frame_"+sec)) { // SWAP IMAGES WHEN PLAYING
					if(src == self._zImages["frame_"+sec]) return;
					else src = self._zImages["frame_"+sec]; 
					}

				else if(sec > self._next || sec < self._ant) {
					src = self.returnSrc(sec); 
					} // RELOAD IF OUT OF INTERVAL
					else return;

					//PRELOAD NEXT IMAGE
					var image = new Image();
					image.onload = function(){
	    			$(self._blackBoardDIV).css('background-image', 'url(' + src + ')'); // UPDATING IMAGE
					};
					image.src = src;

					self._actualImage = src;
			}
		
	},
	returnSrc:function(sec){
		var self = this;
		var ant = 0;
		for (i=0; i<self._keys.length; i++){
			var id = parseInt(self._keys[i].slice(6));
			var lastId = parseInt(self._keys[(self._keys.length-1)].slice(6));
			if(sec < id) {  // PREVIOUS IMAGE
				self._next = id; 
				self._ant = ant; 
				self._imageNumber = i-1;
				return self._zImages["frame_"+ant];} // return previous and keep next change
			else if(sec > lastId && sec < self._videoLength){ // LAST INTERVAL
					self._next = self._videoLength;
					self._ant = lastId;
					return self._zImages["frame_"+ant]; 
			}
				else ant = id;
		}
	},

	getName:function() { 
		return "es.upv.paella.blackBoardPlugin";
	}
});

paella.plugins.blackBoard = new paella.BlackBoard();
