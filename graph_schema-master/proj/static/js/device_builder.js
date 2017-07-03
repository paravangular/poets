var dev = sessionStorage.getItem("active_device");
var data = JSON.parse(sessionStorage.getItem("data"));


function show_device_events() {
	for (var i = 0; i < dev_events.length; i++) {
		var event_div = '<div>Event ID: ' + dev_events[i].eventId + '<br />Type: ' + dev_events[i].type; 
		$("body").append(event_div);
	}
}


function DeviceTimeline(selector, data, active_device) {

	var dev_id = active_device;
	var _data = data;

	var dev_events = get_device_events();
	var neighbours = get_neighbours();

	svg = d3.select("body")
      	.append("svg")
		.attr("width", width)
		.attr("height", height);
	
	svg.append("rect")
	    .attr("width", width)
	    .attr("height", height)
	    .style("fill", "none")
	    .style("pointer-events", "all")
	    .call(d3.zoom()
	    	.on("zoom", function() {
				if (!simulating) {
			    	g.attr("transform", d3.event.transform);
			    }
			}));

	var g = svg.append("g");

    this.data = function(value) {
    	if(!arguments.length) {
        	return _data;
      	}
      	
      	_data = value;
      	return this;
   	}

   	this.draw = function() {
   		
   	}

   	function get_neighbours() {
   		var neighbours = [];
   		for (var i = 0; i < data.edges.length; i++) {
   			if (edges.source === dev_id) {
   				neighbours.append(edges.target);
   			}

   			if (edges.target === dev_id) {
   				neighbours.append(edges.source);
   			}
   		}

   		return neighbours;
   	}

	function get_device_events() {
		dev_send_events = data.events.send.filter(involves_device);
		dev_recv_events = data.events.recv.filter(involves_device);

		return dev_send_events.concat(dev_recv_events).sort(compare_event_id);

		function involves_device(ed) {
			return ed.dev === dev_id; 
		}

		function compare_event_id(evt1, evt2) {
			var id1 = parseInt(evt1.eventId);
			var id2 = parseInt(evt2.eventId);

			if (id1 < id2) {
				return -1;
			}

			if (id1 > id2) {
				return 1;
			}

			return 0;
		}
	}
}