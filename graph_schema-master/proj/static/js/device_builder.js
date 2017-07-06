var dev = sessionStorage.getItem("active_device");
var data = JSON.parse(sessionStorage.getItem("data"));
var timeline = new DeviceTree("body", data, dev);
timeline.draw();



function DeviceTree(selector, data, active_device) {

	var dev_id = active_device;
	var _data = data;

	var dev_events = get_device_events();
	var neighbours = get_neighbours();

	var width = window.innerWidth * 0.7;
   	var height =  window.innerHeight * 0.98;

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
				g.attr("transform", d3.event.transform);
			}));

	var g = svg.append("g");
	var tree = d3.tree()
    			.size([height, width]);
	
    this.data = function(value) {
    	if(!arguments.length) {
        	return _data;
      	}
      	
      	_data = value;
      	return this;
   	}

   	this.draw = function() {
   		var tree_data = data.nodes[dev_id];
   		tree_data.children = [];

   		for (var i = 0; i < neighbours.length; i++) {
   			tree_data.children.push(data.nodes[neighbours[i]]);
   		}

   		var root = d3.hierarchy(tree_data, function(d) { return d.children; });
   		
   		var nodes = tree(root);
      	var links = nodes.descendants().slice(1);

		var link = g.selectAll(".link")
		    .data( nodes.descendants().slice(1))
		  .enter().append("path")
		    .attr("class", "link")
		    .attr("fill", "none")
		    .attr("stroke", "#cccccc")
		    .attr("d", function(d) {
		       return "M" + d.y + "," + d.x
		         + "C" + (d.y + d.parent.y) / 2 + "," + d.x
		         + " " + (d.y + d.parent.y) / 2 + "," + d.parent.x
		         + " " + d.parent.y + "," + d.parent.x;
		       });

		var node = g.selectAll(".node")
		    		.data(nodes.descendants())
		  			.enter().append("g")
		    		.attr("class", function(d) { 
		      			return "node" + (d.children ? " node--internal" : " node--leaf"); })
		    		.attr("transform", function(d) { 
		      			return "translate(" + d.y + "," + d.x + ")"; }
		      			);

		node.append("circle")
			.attr("r", 10);

		node.append("text")
		    .attr("dy", 3)
		    .attr("x", function(d) { return d.children ? -16 : 16; })
		    .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
		    .text(function(d) { return d.data.id; });
   	}


	this.show_device_events = function() {
		for (var i = 0; i < dev_events.length; i++) {
			var event_div = '<div>Event ID: ' + dev_events[i].eventId + '<br />Type: ' + dev_events[i].type; 
			$("body").append(event_div);
		}
	}

   	function get_neighbours() {
   		var neighbours = [];
   		for (var i = 0; i < data.edges.length; i++) {
   			if (data.edges[i].source === dev_id) {
   				neighbours.push(data.edges[i].target);
   			}

   			if (data.edges[i].target === dev_id) {
   				neighbours.push(data.edges[i].source);
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
