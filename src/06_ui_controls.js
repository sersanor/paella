Class ("paella.TimeControl", paella.DomNode,{
	initialize:function(id) {
		this.parent('div',id,{left:"0%"});
		this.domElement.className = 'timeControlOld';
		this.domElement.className = 'timeControl';
		//this.domElement.innerHTML = "0:00:00";
		var thisClass = this;
		paella.events.bind(paella.events.timeupdate,function(event,params) { thisClass.onTimeUpdate(params); });
	},

	onTimeUpdate:function(memo) {
		var videoContainer = memo.videoContainer;
		var real = { start:0, end:videoContainer.duration };
		var trimmed = { start:videoContainer.trimStart(), end:videoContainer.trimEnd() };
		var currentTime = memo.currentTime - trimmed.start;
		var duration = trimmed.end - trimmed.start;
		var percent = currentTime * 100 / duration;
		if (this.domElement.className=="timeControlOld") {	// Support for old style time control
			this.domElement.style.left = percent + '%';
		}
		this.domElement.innerHTML = this.secondsToHours(parseInt(currentTime));
	},

	secondsToHours:function(sec_numb) {
		var hours   = Math.floor(sec_numb / 3600);
		var minutes = Math.floor((sec_numb - (hours * 3600)) / 60);
		var seconds = sec_numb - (hours * 3600) - (minutes * 60);

		if (hours < 10) {hours = "0"+hours;}
		if (minutes < 10) {minutes = "0"+minutes;}
		if (seconds < 10) {seconds = "0"+seconds;}
		return hours + ':' + minutes + ':' + seconds;
	}
});

Class ("paella.PlaybackBar", paella.DomNode,{
	playbackFullId:'',
	updatePlayBar:true,
	timeControlId:'',
	//OVERLAY VARIABLES
	_images:null,
	_keys:null,
	_ant:null,
	_next:null,
	_videoLength:null,
	_lastSrc:null,
	_aspectRatio:1.777777778, // 16:9

	initialize:function(id) {
		var self = this;
		//OVERLAY INITIALIZE
		self.imageSetup();
		//END OVERLAY INITIALIZE

		var style = {};
		this.parent('div',id,style);
		this.domElement.className = "playbackBar";
		this.domElement.setAttribute("alt", "");
		this.domElement.setAttribute("title", "Timeline Slider");
		this.domElement.setAttribute("aria-label", "Timeline Slider");
		this.domElement.setAttribute("role", "slider");
		this.domElement.setAttribute("aria-valuemin", "0");
		this.domElement.setAttribute("aria-valuemax", "100");
		this.domElement.setAttribute("aria-valuenow", "0");
		this.domElement.setAttribute("tabindex", "1100");
		$(this.domElement).keyup(function(event){
			var curr, selectedPosition;
			switch(event.keyCode) {
				case 37: //Left
					curr = 100*paella.player.videoContainer.currentTime()/paella.player.videoContainer.duration();
					selectedPosition = curr - 5;
					paella.events.trigger(paella.events.seekTo,{ newPositionPercent:selectedPosition });
					break;
				case 39: //Right
					curr = 100*paella.player.videoContainer.currentTime()/paella.player.videoContainer.duration();
					selectedPosition = curr + 5;
					paella.events.trigger(paella.events.seekTo,{ newPositionPercent:selectedPosition });
					break;
			}
		});

		this.playbackFullId = id + "_full";
		this.timeControlId = id + "_timeControl";
		var playbackFull = new paella.DomNode('div',this.playbackFullId,{width:'0%'});
		playbackFull.domElement.className = "playbackBarFull";
		this.addNode(playbackFull);
		this.addNode(new paella.TimeControl(this.timeControlId));
		var thisClass = this;
		paella.events.bind(paella.events.timeupdate,function(event,params) { thisClass.onTimeUpdate(params); });
		$(this.domElement).bind('mousedown',function(event) { paella.utils.mouseManager.down(thisClass,event); event.stopPropagation(); });
		$(playbackFull.domElement).bind('mousedown',function(event) { paella.utils.mouseManager.down(thisClass,event); event.stopPropagation();  });
		$(this.domElement).bind('mousemove',function(event) { thisClass.movePassive(event); paella.utils.mouseManager.move(event); });
		$(playbackFull.domElement).bind('mousemove',function(event) { paella.utils.mouseManager.move(event); });
		$(this.domElement).bind('mouseup',function(event) { paella.utils.mouseManager.up(event); });
		$(playbackFull.domElement).bind('mouseup',function(event) { paella.utils.mouseManager.up(event); });

		//MOUSE OUT BIND
		$(this.domElement).bind("mouseout",function(event) { thisClass.mouseOut(event); });

		if (paella.player.isLiveStream()) {
			$(this.domElement).hide();
		}
	},

	mouseOut:function(event){
			$("#divTimeImageOverlay").remove();
	},

	movePassive:function(event){
		var self = this;
		
		// CONTROLS_BAR POSITON
		var p = $("#playerContainer_controls_playback_playbackBar");
		var pos = p.offset();

		var width = $("#playerContainer_controls_playback_playbackBar").width();
		var left = (event.clientX-pos.left);
		left = (left < 0) ? 0 : left;
		var position = left * 100 / width; // GET % OF THE STREAM
		var time = paella.player.videoContainer.duration("");

		time = ( position * time / 100 );


		var hou = Math.floor(time / 3600)%24;
		hou = ("00"+hou).slice(hou.toString().length);

		var min = Math.floor(time / 60)%60;
		min = ("00"+min).slice(min.toString().length);

		var sec = Math.floor(time%60);
		sec = ("00"+sec).slice(sec.toString().length);



		var timestr = (hou+":"+min+":"+sec);

		// CREATING THE OVERLAY
		if($("#divTimeImageOverlay").length == 0) self.setupTimeImageOverlay(timestr,pos.top,width);
		else {
			$("#divTimeOverlay")[0].innerHTML = timestr; //IF CREATED, UPDATE TIME AND IMAGE
		}

		// CALL IMAGEUPDATE
		self.imageUpdate(time);	
		
		// UPDATE POSITION IMAGE OVERLAY

		var ancho = $("#divTimeImageOverlay").width();
		var posx = event.clientX-(ancho/2);
		if(event.clientX > (ancho/2 + pos.left)  &&  event.clientX < (pos.left+width - ancho/2) ) { // LEFT
		$("#divTimeImageOverlay").css("left",posx); // CENTER THE DIV HOVER THE MOUSE
		}
		else if(event.clientX < width / 2)
			$("#divTimeImageOverlay").css("left",pos.left);
		else 
			$("#divTimeImageOverlay").css("left",pos.left + width - ancho);

		// UPDATE POSITION TIME OVERLAY

		var ancho2 = $("#divTimeOverlay").width();
		var posx2 = event.clientX-(ancho2/2);
		if(event.clientX > ancho2/2 + pos.left  && event.clientX < (pos.left+width - ancho2/2) ){
		$("#divTimeOverlay").css("left",posx2); // CENTER THE DIV HOVER THE MOUSE
		}
		else if(event.clientX < width / 2)
			$("#divTimeOverlay").css("left",pos.left);
		else 
			$("#divTimeOverlay").css("left",pos.left + width - ancho2-2);


		//TOP ADJUSTO TO IMAGE RES
		p = $("#divTimeImageOverlay").height();
		$("#divTimeImageOverlay").css("top",pos.top-p);


	},

	imageSetup:function(){
		var self = this;
		
		//  BRING THE IMAGE ARRAY TO LOCAL
		this._images = {};
		var n = paella.initDelegate.initParams.videoLoader.frameList;

		this._images = n; // COPY TO LOCAL
		this._videoLength = paella.player.videoContainer.duration(""); // video duration in frames

		// SORT KEYS FOR SEARCH CLOSEST
		this._keys = Object.keys(this._images);
		this._keys = this._keys.sort(function(a, b){return parseInt(a)-parseInt(b);}); // SORT FRAME NUMBERS STRINGS

		//NEXT
		this._next = 0;
		this._ant = 0;
	},

	imageUpdate:function(sec){
		var self = this;

		var src = $("#imgOverlay").attr('src');

				if(sec > this._next || sec < this._ant) { 
					src = self.returnSrc(sec);
					self._lastSrc = src;
					$( "#imgOverlay" ).attr('src', src); // UPDATING IMAGE
				} // RELOAD IF OUT OF INTERVAL
					else { 	
						if(src!=undefined) { return; }
						else { 
							$( "#imgOverlay" ).attr('src', self._lastSrc); 
						}// KEEP LAST IMAGE
					}			

				

	},

	returnSrc:function(sec){
		var ant = 0;
		for (i=0; i<this._keys.length; i++){
			var id = parseInt(this._keys[i]);
			var lastId = parseInt(this._keys[(this._keys.length-1)]);
			if(sec < id) {  // PREVIOUS IMAGE
				this._next = id; 
				this._ant = ant; 
				return this._images[ant].thumb;} // return previous and keep next change
			else if(sec > lastId && sec < this._videoLength){ // LAST INTERVAL
					this._next = this._videoLength;
					this._ant = lastId;
					return this._images[ant].thumb; 
			}
				else ant = id;
		}
	},

	setupTimeImageOverlay:function(time_str,top,width){
		var self = this;

		var div = document.createElement("div");
		div.className = "divTimeImageOverlay";
		div.id = ("divTimeImageOverlay");

		var aux = Math.round(width/10);
		div.style.width = Math.round(aux*self._aspectRatio)+"px"; //KEEP ASPECT RATIO 4:3
		div.style.height = Math.round(aux)+"px";

		var img = document.createElement("img");
		img.className =  "imgOverlay";
		img.id = "imgOverlay";

		div.appendChild(img);


		var div2 = document.createElement("div");
		div2.className = "divTimeOverlay";
		div2.style.top = (top-20)+"px"; 
		div2.id = ("divTimeOverlay");
		div2.innerHTML = time_str;

		div.appendChild(div2);

		var controlBar = document.getElementById('playerContainer_controls_playback_playbackBar');
		controlBar.appendChild(div); //CHILD OF CONTROLS_BAR

	},

	playbackFull:function() {
		return this.getNode(this.playbackFullId);
	},

	timeControl:function() {
		return this.getNode(this.timeControlId);
	},

	setPlaybackPosition:function(percent) {
		this.playbackFull().domElement.style.width = percent + '%';
	},

	isSeeking:function() {
		return !this.updatePlayBar;
	},

	onTimeUpdate:function(memo) {
		if (this.updatePlayBar) {
			var videoContainer = memo.videoContainer;
			var real = { start:0, end:videoContainer.duration };
			var trimmed = { start:videoContainer.trimStart(), end:videoContainer.trimEnd() };
			var currentTime = memo.currentTime - trimmed.start;
			var duration = trimmed.end - trimmed.start;
			this.setPlaybackPosition(currentTime * 100 / duration);
		}
	},

	down:function(event,x,y) {
		this.updatePlayBar = false;
		this.move(event,x,y);
	},

	move:function(event,x,y) {
		var width = $(this.domElement).width();
		var selectedPosition = x - $(this.domElement).offset().left; // pixels
		if (selectedPosition<0) {
			selectedPosition = 0;
		}
		else if (selectedPosition>width) {
			selectedPosition = 100;
		}
		else {
			selectedPosition = selectedPosition * 100 / width; // percent
		}
		this.setPlaybackPosition(selectedPosition);
	},

	up:function(event,x,y) {
		var width = $(this.domElement).width();
		var selectedPosition = x - $(this.domElement).offset().left; // pixels
		if (selectedPosition<0) {
			selectedPosition = 0;
		}
		else if (selectedPosition>width) {
			selectedPosition = 100;
		}
		else {
			selectedPosition = selectedPosition * 100 / width; // percent
		}
		paella.events.trigger(paella.events.seekTo,{ newPositionPercent:selectedPosition });
		this.updatePlayBar = true;
	}
});

Class ("paella.PlaybackControl",paella.DomNode,{
	playbackBarId:'',
	pluginsContainer:null,
	popUpPluginContainer:null,
	timeLinePluginContainer:null,

	playbackPluginsWidth:0,
	popupPluginsWidth:0,

	minPlaybackBarSize:120,

	playbackBarInstance:null,

	buttonPlugins:[],

	addPlugin:function(plugin) {
		var thisClass = this;

		var id = 'buttonPlugin' + this.buttonPlugins.length;
		this.buttonPlugins.push(plugin);
		var button = paella.ButtonPlugin.buildPluginButton(plugin,id);
		plugin.button = button;
		this.pluginsContainer.domElement.appendChild(button);
		$(button).hide();
		plugin.checkEnabled(function(isEnabled) {
			var parent;
			if (isEnabled) {
				$(plugin.button).show();
				paella.pluginManager.setupPlugin(plugin);

				var id = 'buttonPlugin' + thisClass.buttonPlugins.length;
				if (plugin.getButtonType()==paella.ButtonPlugin.type.popUpButton) {
					parent = thisClass.popUpPluginContainer.domElement;
					var popUpContent = paella.ButtonPlugin.buildPluginPopUp(parent,plugin,id + '_container');
					thisClass.popUpPluginContainer.registerContainer(plugin.getName(),popUpContent,button,plugin);
				}
				else if (plugin.getButtonType()==paella.ButtonPlugin.type.timeLineButton) {
					parent = thisClass.timeLinePluginContainer.domElement;
					var timeLineContent = paella.ButtonPlugin.buildPluginPopUp(parent, plugin,id + '_timeline');
					thisClass.timeLinePluginContainer.registerContainer(plugin.getName(),timeLineContent,button,plugin);
				}
			}
			else {
				thisClass.pluginsContainer.domElement.removeChild(plugin.button);
			}
		});
	},

	initialize:function(id) {
		var style = {};
		this.parent('div',id,style);
		this.domElement.className = 'playbackControls';
		this.playbackBarId = id + '_playbackBar';

		var thisClass = this;
		this.pluginsContainer = new paella.DomNode('div',id + '_playbackBarPlugins');
		this.pluginsContainer.domElement.className = 'playbackBarPlugins';
		this.pluginsContainer.domElement.setAttribute("role", "toolbar");
		this.addNode(this.pluginsContainer);

		this.popUpPluginContainer = new paella.PopUpContainer(id + '_popUpPluginContainer','popUpPluginContainer');
		this.addNode(this.popUpPluginContainer);
		this.timeLinePluginContainer = new paella.TimelineContainer(id + '_timelinePluginContainer','timelinePluginContainer');
		this.addNode(this.timeLinePluginContainer);
		this.addNode(new paella.PlaybackBar(this.playbackBarId));

		paella.pluginManager.setTarget('button',this);
	},

	playbackBar:function() {
		if (this.playbackBarInstance==null) {
			this.playbackBarInstance = this.getNode(this.playbackBarId);
		}
		return this.playbackBarInstance;
	},

	onresize:function() {
		var windowSize = $(this.domElement).width();
		base.log.debug("resize playback bar (width=" + windowSize + ")");

		for (var i=0;i<this.buttonPlugins.length;++i) {
			var plugin = this.buttonPlugins[i];
			var minSize = plugin.getMinWindowSize();
			if (minSize>0 && windowSize<minSize) {
				plugin.hideUI();
			}
			else {
				plugin.checkVisibility();
			}
		}
	}
});

Class ("paella.ControlsContainer", paella.DomNode,{
	playbackControlId:'',
	editControlId:'',
	isEnabled:true,

	autohideTimer:null,
	hideControlsTimeMillis:3000,

	playbackControlInstance:null,

	videoOverlayButtons:null,

	buttonPlugins:[],

	addPlugin:function(plugin) {
		var thisClass = this;
		var id = 'videoOverlayButtonPlugin' + this.buttonPlugins.length;
		this.buttonPlugins.push(plugin);
		var button = paella.ButtonPlugin.buildPluginButton(plugin,id);
		this.videoOverlayButtons.domElement.appendChild(button);
		plugin.button = button;
		$(button).hide();
		plugin.checkEnabled(function(isEnabled) {
			if (isEnabled) {
				$(plugin.button).show();
				paella.pluginManager.setupPlugin(plugin);
			}
		});
	},

	initialize:function(id) {
		this.parent('div',id);
		this.viewControlId = id + '_view';
		this.playbackControlId = id + '_playback';
		this.editControlId = id + '_editor';
		this.addNode(new paella.PlaybackControl(this.playbackControlId));
		var thisClass = this;
		paella.events.bind(paella.events.showEditor,function(event) { thisClass.onShowEditor(); });
		paella.events.bind(paella.events.hideEditor,function(event) { thisClass.onHideEditor(); });

		paella.events.bind(paella.events.play,function(event) { thisClass.onPlayEvent(); });
		paella.events.bind(paella.events.pause,function(event) { thisClass.onPauseEvent(); });
		paella.events.bind('mousemove',function(event) { thisClass.onMouseMoveEvent(); });
		paella.events.bind(paella.events.endVideo,function(event) { thisClass.onEndVideoEvent(); });
		paella.events.bind('keydown',function(event) { thisClass.onKeyEvent(); });

		this.videoOverlayButtons = new paella.DomNode('div',id + '_videoOverlayButtonPlugins');
		this.videoOverlayButtons.domElement.className = 'videoOverlayButtonPlugins';
		this.videoOverlayButtons.domElement.setAttribute("role", "toolbar");
		this.addNode(this.videoOverlayButtons);

		paella.pluginManager.setTarget('videoOverlayButton',this);
	},

	onShowEditor:function() {
		var editControl = this.editControl();
		if (editControl) $(editControl.domElement).hide();
	},

	onHideEditor:function() {
		var editControl = this.editControl();
		if (editControl) $(editControl.domElement).show();
	},

//	showEditorButton:function() {
//		this.addNode(new EditControl(this.editControlId));
//	},

	enterEditMode:function() {
		var playbackControl = this.playbackControl();
		var editControl = this.editControl();
		if (playbackControl && editControl) {
			$(playbackControl.domElement).hide();
		}
	},

	exitEditMode:function() {
		var playbackControl = this.playbackControl();
		var editControl = this.editControl();
		if (playbackControl && editControl) {
			$(playbackControl.domElement).show();
		}
	},

	playbackControl:function() {
		if (this.playbackControlInstance==null) {
			this.playbackControlInstance = this.getNode(this.playbackControlId);
		}
		return this.playbackControlInstance;
	},

	editControl:function() {
		return this.getNode(this.editControlId);
	},

	disable:function() {
		this.isEnabled = false;
		this.hide();
	},

	enable:function() {
		this.isEnabled = true;
		this.show();
	},

	hide:function() {
		var This = this;
		if (!base.userAgent.browser.IsMobileVersion) {
			$(this.domElement).animate({opacity:0.0},{duration:300, complete:function(){
				This.domElement.setAttribute('aria-hidden', 'true');
				//$(This.domElement).hide();
			}});
			paella.events.trigger(paella.events.controlBarWillHide);
		}
		else {
			base.log.debug("Mobile version: controls will not hide");
		}
	},

	show:function() {
		if (this.isEnabled) {
			if (this.domElement.style.opacity!=1.0) {
				this.domElement.style.opacity = 1.0;
				this.domElement.setAttribute('aria-hidden', 'false');
				//$(this.domElement).show();
				paella.events.trigger(paella.events.controlBarDidShow);
			}
		}
	},

	autohideTimeout:function() {
		var playbackBar = this.playbackControl().playbackBar();
		if (playbackBar.isSeeking()) {
			this.restartAutohideTimer();
		}
		else {
			this.hideControls();
		}
	},

	hideControls:function() {
		this.hide();
	},

	showControls:function() {
		this.show();
	},

	onPlayEvent:function() {
		this.restartAutohideTimer();
	},

	onPauseEvent:function() {
		this.clearAutohideTimer();
	},

	onEndVideoEvent:function() {
		this.show();
		this.clearAutohideTimer();
	},

	onKeyEvent:function() {
		this.showControls();
		if (paella.player.videoContainer.isReady() && !paella.player.videoContainer.paused()) {
			this.restartAutohideTimer();
		}
	},

	onMouseMoveEvent:function() {
		this.showControls();
		if (paella.player.videoContainer.isReady() && !paella.player.videoContainer.paused()) {
			this.restartAutohideTimer();
		}
	},

	clearAutohideTimer:function() {
		if (this.autohideTimer!=null) {
			this.autohideTimer.cancel();
			this.autohideTimer = null;
		}
	},

	restartAutohideTimer:function() {
		this.clearAutohideTimer();
		var thisClass = this;
		this.autohideTimer = new base.Timer(function(timer) {
			thisClass.autohideTimeout();
		},this.hideControlsTimeMillis);
	},

	onresize:function() {
		this.playbackControl().onresize();
	}
});
