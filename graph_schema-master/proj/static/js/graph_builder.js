function load_graph_instance(filename) {
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function(){
  		if(xmlhttp.readyState === 4 && xmlhttp.status === 200) {

			var xmlDoc = xmlhttp.responseXML;

			var graphProperties = xmlDoc.getElementsByTagName("GraphInstance")[0].getElementsByTagName("Properties");
			var p = JSON.parse("{" + graphProperties[0].innerHTML + "}");

			var nodesList = xmlDoc.getElementsByTagName("DevI");
			var nodes = [];

			for (var i = 0; i < nodesList.length; i++) {
				var n = nodesList[i];
				var id = n.getAttribute("id");
		   		var type = n.getAttribute("type");
				var prop = JSON.parse("{" + n.childNodes[1].innerHTML + "}"); // gets the p element

				var node = { "id": id,
				       		"type": type,
				       		"p": prop }

				nodes.push(node);
			}

			var edgesList = xmlDoc.getElementsByTagName("EdgeI");
			var edges = [];

			for (var i = 0; i < edgesList.length; i++) {
				var n = edgesList[i];
		   		var reSource = /(.+):in/
		   		var reTarget = /-(.+):out/
		   		var path = n.getAttribute("path")
		   		var source = reSource.exec(path)[1];
		   		var target = reTarget.exec(path)[1];
				       		
				var edge = {"source": source,
				       		"target": target}

				edges.push(edge);
			}

		   	var data = {
		   		"nodes": nodes,
		   		"edges": edges,
		   		"p": p
		   	}
		   	return data;
		}
	}
	xmlhttp.open("GET", filename, false);
	xmlhttp.send();

	return xmlhttp.onreadystatechange();
}

function load_node_props(filename) {
	var xmlhttp = new XMLHttpRequest();
	
	xmlhttp.onreadystatechange = function(){
  		if(xmlhttp.readyState === 4 && xmlhttp.status === 200) {
  			var props = [];
			var xmlDoc = xmlhttp.responseXML;
			var devTypes = xmlDoc.getElementsByTagName("DeviceType");

			for (var i = 0; i < devTypes.length; i++) {
				var prop = devTypes[i].getElementsByTagName("State")[0].childNodes;
				
				for (var j = 1; j < prop.length; j += 2) {
					var name = prop[j].getAttribute("name");
					props.push(name);
				}
				
			}

			return props;
			
		}
	}
	xmlhttp.open("GET", filename, false);
	xmlhttp.send();

	return xmlhttp.onreadystatechange();
}

function load_initial_graph_state(filename, graph_instance) {
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function(){
  		if(xmlhttp.readyState === 4 && xmlhttp.status === 200) {

			var xmlDoc = xmlhttp.responseXML;
			var initEvents = xmlDoc.getElementsByTagName("InitEvent");

			for (var i = 0; i < initEvents.length; i++) {
				var n = initEvents[i];
				var id = n.getAttribute("dev");
				var prop = JSON.parse("{" + n.childNodes[1].innerHTML + "}"); // gets the p element

				var node = find_node_by_id(graph_instance.nodes, id);
				Object.assign(node.p, prop);
			}

		   	return;
		}
	}
	xmlhttp.open("GET", filename, false);
	xmlhttp.send();

	return xmlhttp.onreadystatechange();

}

function load_graph_events(filename) {
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if(xmlhttp.readyState === 4 && xmlhttp.status === 200) {
			var events = { "send": [],
							"recv": [] }

			var xmlDoc = xmlhttp.responseXML;
			var sendEvents = xmlDoc.getElementsByTagName("SendEvent");
			var recvEvents = xmlDoc.getElementsByTagName("RecvEvent");

			for (var i = 0; i < sendEvents.length; i++) {
				var eventXml = sendEvents[i];
				var evt = {};

				for (var j = 0; j < eventXml.attributes.length; j++) {
					  var attr = eventXml.attributes[j];
					  evt[attr.name] = attr.value; 
				}

				var s = JSON.parse("{" + eventXml.childNodes[1].innerHTML + "}");
				var m = JSON.parse("{" + eventXml.childNodes[3].innerHTML + "}");

				evt.node_prop = s;
				evt.msg_prop = m;
				evt.type = "send";

				events.send.push(evt);
			}

			for (var i = 0; i < recvEvents.length; i++) {
				var eventXml = recvEvents[i];
				var evt = {};

				for (var j = 0; j < eventXml.attributes.length; j++) {
					  var attr = eventXml.attributes[j];
					  evt[attr.name] = attr.value; 
				}

				var s = JSON.parse("{" + eventXml.childNodes[1].innerHTML + "}");

				evt.node_prop = s;
				evt.type = "recv";
				events.recv.push(evt);
			}

			return events;
		}
	}

	xmlhttp.open("GET", filename, false); // TODO: false is deprecated
	xmlhttp.send();
	return xmlhttp.onreadystatechange();
}

function ForceGraph(selector, data) {

  	// d3 vars
	var width = window.innerWidth * 0.7;
   	var height = window.innerHeight * 0.98;
  	var _data = data;


	// logic vars
	var simulating = false;
  	var prop_domain = [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY];
  	var message_passing_time = 100;
  	var last_event_time = get_last_event_time();

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

	var tooltip = d3.select("body").append("div").attr("class", "tooltip");


    this.data = function(value) {
    	if(!arguments.length) {
        	return _data;
      	}
      	
      	_data = value;
      	return this;
   	}

   	this.draw = function() {
   		var simulation = d3.forceSimulation()
				    .force("link", d3.forceLink().id(function(d) { return d.id; }).distance(50).strength(1))
				    .force("charge", d3.forceManyBody())
				    .force("center", d3.forceCenter(width / 2, height / 2));

		link = g.append("g")
				    	.attr("class", "edges")
				    	.selectAll("line")
				    	.data(data.edges)
				    	.enter().append("line")
							      	.attr("stroke", "#cccccc");


		node = g.append("g")
				    .attr("class", "nodes")
				    .selectAll("circle") // TODO: device shape
				    .data(data.nodes)
				    .enter().append("circle")
				    .attr("class", function(d) { return d.id })
				    .attr("r", 10)
				    .attr("fill", function(d) { 
				    	var selected = $("input[name='property']:checked").val();
				    	return get_node_colour(selected, d.p[selected])
				    })
				    .attr("stroke", "#FFFFFF")
				    .attr("stroke-width", "2px")
				    .on("click", function(d) { 
				    	tooltip
			              .style("display", "inline-block")
			              .html(show_node_state(d));

			            var tooltip_node = d3.select('.tooltip')._groups[0][0];

			            var tooltip_width =  tooltip_node.getBoundingClientRect().width;
			            var tooltip_height = tooltip_node.getBoundingClientRect().height;

			            tooltip.style("left", d3.event.pageX - tooltip_width / 2 + "px")
			              	.style("top", d3.event.pageY - (tooltip_height + 20) + "px")

				    	if (d3.select(this).classed("selected-node")) {
				    		d3.select(this)
								.classed("selected-node", false);

				    	} else {
				    		d3.select(".selected-node")
								.classed("selected-node", false);

							d3.select(this)
								.classed("selected-node", true);
				    	}
					})
				    .on("dblclick", function(d) {
				    	show_device_details(d);
				    })
				    .on("mouseout", function(d) {
				    	tooltip
				    		.style("display", "none");

				    	if (d3.select(this).classed("selected-node")) {
				    		d3.select(this)
								.classed("selected-node", false);

				    	}
				    })
				    .call(d3.drag()
			        .on("start", dragstarted)
			        .on("drag", dragged)
			        .on("end", dragended));

		simulation.nodes(data.nodes)
	      			.on("tick", ticked);

	  	simulation.force("link")
	      			.links(data.edges);

	    function ticked() {
			link
		        .attr("x1", function(d) { return d.source.x; })
		        .attr("y1", function(d) { return d.source.y; })
		        .attr("x2", function(d) { return d.target.x; })
		        .attr("y2", function(d) { return d.target.y; });

		    node
		        .attr("cx", function(d) { return d.x; })
		        .attr("cy", function(d) { return d.y; });
		}

		function show_device_details(d) {
			$.get({
			       url: '/device_details', 
			       success: function(response) {
				        sessionStorage.setItem('active_device', d.id);
				        window.location.href = '/device_details';

			       }
			});

		}

		function show_node_state(d) {
			var prop_string = 'ID: ' + d.id + '<br>' + 'Type: ' + d.type + '<br>';

			for (var prop in d.p) {
				prop_string += prop + ': ' + d.p[prop] + '<br>';
			}

			return prop_string;
		}

		function dragstarted(d) {
			if (!simulating) {
				if (!d3.event.active) simulation.alphaTarget(0.3).restart();
			    d.fx = d.x;
			    d.fy = d.y;
			}
		    
		  }

		  function dragged(d) {
			if (!simulating) {
			    d.fx = d3.event.x;
			    d.fy = d3.event.y;
			}
		  }

		  function dragended(d) {
			if (!simulating) {
				 if (!d3.event.active) simulation.alphaTarget(0);
			    d.fx = null;
			    d.fy = null;
			}
		   
		  }
   	}

	this.clear = function() {
   		d3.selectAll("g > *").remove();
   	}

   	this.change_colour = function(prop) {
   		set_prop_domain(prop);
   		console.log(prop_domain);
   	}

	this.stop_poets_simulation = function() {
		simulating = false;
		d3.selectAll("circle.marker").remove();

        $("#stop").prop('disabled', true);
        $("#start").prop('disabled', false);
	}
	   	
	this.start_poets_simulation = function() {

        $("#start").prop('disabled', true);
        $("#stop").prop('disabled', false);
		simulating = true;


		setTimeout(function() {timeout_loop(0)}, 50);

		function timeout_loop(i) {
			if (simulating) {
				update_dataset(data, data.events.send[i]);
			    i++;
			    if (i < data.events.send.length) {
			    	setTimeout(function(){timeout_loop(i);}, 1);
			    } else {
			    	// stop_poets_simulation is not defined?
			    	simulating = false;
					d3.selectAll("circle.marker").remove();

			        $("#stop").prop('disabled', true);
			        $("#start").prop('disabled', false);
			    }
			}
			
		}

	}

	function get_last_event_time() {
		var sends = data.events.send;
		var recvs = data.events.recv;

		return Math.max(sends[sends.length - 1], recvs[recvs.length - 1]);
	}

	function get_node_colour(prop, value) {
		var colour = d3.scaleLinear()
  						.domain(prop_domain)
  						.interpolate(d3.interpolateHcl)
      					.range([d3.rgb("#007AFF"), d3.rgb('#FF0000')]);

      	return colour(value);
   	}


   	function set_prop_domain(prop) {
   		// TODO: to avoid recalculation, store this as property?
   		var min = Number.POSITIVE_INFINITY,
   			max = Number.NEGATIVE_INFINITY;

   		var all_events = data.events.send.concat(data.events.recv);
  		
  		for (var i = 0; i < all_events.length; i++) {
			var p = all_events[i].node_prop[prop];

			if (typeof(p) != "undefined") {
				min = Math.min(min, p);
				max = Math.max(max, p);
	   		}
	   	}
   		
   		prop_domain[0] = min;
   		prop_domain[1] = max;
   	}

	function update_dataset(data, send_evt) {
		var id = send_evt.dev;
		var p = send_evt.node_prop;


		var n = find_node_by_id(data.nodes, id);
		n.p = p;

		// TODO: find better way: use d3 merges?
		var source_circle = d3.select("circle." + id)
		var selected = $("input[name='property']:checked").val();

		source_circle.attr("fill", function(d) { 
			return get_node_colour(selected, n.p[selected]);
		});

	    var start = circle_point(source_circle);
	    var ends = [];

		var recv_evts = find_recv_event(data.events, send_evt);
		for (var i = 0; i < recv_evts.length; i++) {
			var target_circle = d3.select("circle." + recv_evts[i].dev)
			ends.push(circle_point(target_circle));

		}

		message_animation(start, ends);

	    function circle_point(circle) {
		    var x = circle._groups[0][0].cx.animVal.value,
		    	y = circle._groups[0][0].cy.animVal.value;

		    return x + ", " + y;
		}

		function message_animation(s, es) {
			var markers = [];

			for (var i = 0; i < es.length; i++) {
				markers.push(g.append("circle"));
				markers[i].attr("r", 4)
					.attr("class", "marker")
					.attr("fill", "green")
				   	.attr("transform", "translate(" + s + ")");

				markers[i].transition()
	        		.duration(message_passing_time)
		        	.attr("transform", "translate(" + es[i] + ")")
		        	.remove();
			}
			
		}

		function find_recv_event(events, send) {
			var send_id = send.eventId;

			var recv_evts = [];

			for (var i = 0; i < events.recv.length; i++) {

				if (events.recv[i].sendEventId === send_id) {
					recv_evts.push(events.recv[i]);
				}
			}

			return recv_evts;
		}

	}

}


function find_node_by_id(nodes, id) {
 	for (var i = 0; i < nodes.length; i++) {
   		if (nodes[i].id === id) {
     			return nodes[i];
   		}
  	}
  	throw "Couldn't find object with id: " + id;
}

function find_edges_by_source_id(edges, source_id) {
	var edgeList = []
	for (var i = 0; i < edges.length; i++) {
   		if (edges[i].source === source_id) {
     			edgeList.push(edges[i]);
   		}
  	}

  	return edgeList;
}

function get_last_child(xmln) {
	console.log(xmln);
    var x = xmln.lastChild;
    while (x.nodeType != 1) {
        x = x.previousSibling;
    }
    return x;
}

function load_property_menu(props) {
	for (var p = 0; p < props.length; p++) {
		var radio = $('<input type="radio" name="property" value= "' + props[p] + '">' + props[p] + '<br>');
    	radio.appendTo('#property-menu');
	}

}

