function Event(event) {
	var source_device,
		source_port,
		target_device,
		target_port,
		event_duration = 100 // default

	/*
	event time
	start location - end location
	*/

	var edge_class = "." + source_device + ":" + target_device;
	

	this.draw = function() {
		var path = d3.select(edge_class) // node()?
		var start_point = get_node_centroid(source_device);

		var marker = g.append("circle")
						.attr("class", "message")
						.attr("fill", "green")
						.attr("transform", "translate(" + start_point + ")");


		function transition(marker) {
			marker.transition()
			    .duration(event_duration)
			    .attrTween("transform", translateAlong(path.node()))
			    .remove();
		}


		function get_node_centroid(node) {
        	var bibox = d3.select("." + node).node().getBBox();

	        var t = get_translation(d3.select(node.node()).attr("transform")),
    	    	x = t[0] + (bibox.x + bibox.width)/2 - bibox.width / 4,
        		y = t[1] + (bibox.y + bibox.height)/2 - bibox.height / 4;
        	return x + ", " + y;
    	}

	}

	this.set_event_time = function(time) {
		event_duration = time;
	}
}
