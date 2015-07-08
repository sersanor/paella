Class ("paella.plugins.PopupPlugin", paella.EventDrivenPlugin,{
	_array:null,
	_stack:null, // stack for no repeat the action again
	_prevTime:null, // keep the last time showing the iFrame
	checkEnabled:function(onSuccess) {
		onSuccess(true);
	},

	getName:function() { 
		return "es.upv.paella.popupPlugin";
	},

	getEvents:function() {
		return[
			paella.events.timeUpdate
		];
    },

    setup:function(){
    	var self = this;
    	self._stack = [];
    	self._array = 	{"test":[
							    {"time":12, "url":"www.upv.es"},
							    {"time":16, "url":"www.xataka.com"},
							    {"time":25, "url":"www.bitelia.com"},
							    {"time":30, "url":"www.gizmodo.com"},
							    {"time":45, "url":"www.random.org"}
  								]
						};
    },

    onEvent:function(event, params){
    	var self = this;
    	switch(event){
    		//case paella.events.timeUpdate: if(!self._stack.contains(Math.round(params.currentTime))){this.drawPopUp(event,params);} break;
    		case paella.events.timeUpdate: if(self._prevTime!=(Math.round(params.currentTime))){this.drawPopUp(event,params);} break;
    	}
    },

    drawPopUp:function(event,params){
    	var self = this;
    	var p = {};
    	p.closeButton=true;
    	p.onClose = function(){
    		paella.events.trigger(paella.events.play);
    	};
    	self._array.test.some(function(element, index, array){
    		if(element.time == Math.round(params.currentTime)){
	    		paella.messageBox.showFrame("http://"+element.url, p);
	    		//self._stack.push(element.time);
	    		self._prevTime = element.time;
	    		paella.events.trigger(paella.events.pause);
	    		return true;
    		}
    	});
    	
    }
});
new paella.plugins.PopupPlugin();