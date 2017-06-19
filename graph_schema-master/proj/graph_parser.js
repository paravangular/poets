function load_graph_instance(filename) {
	xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function(){
  		if(xmlhttp.readyState === 4 && xmlhttp.status === 200) {

			var xmlDoc = xmlhttp.responseXML;
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
		   		"edges": edges
		   	}
		   	return data;
		}
	}
	xmlhttp.open("GET", filename, false);
	xmlhttp.send();

	return xmlhttp.onreadystatechange();
}

function load_graph_events(filename) {
	var events = [];
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if(xmlhttp.readyState === 4 && xmlhttp.status === 200) {
			var lines = xmlhttp.responseText.split('\n');

			for (var i = 0; i < lines.length; i++) {
				if (lines[i].startsWith("Send:")) {
					var source_id = /\s(.+):out/.exec(lines[i])[1];
					var curr_spin = parseInt(/curr_spin\s=\s(-?\d)/.exec(lines[i])[1]);

					i++
					var send_again = parseInt(/sendAgain\s=\s(\d)/.exec(lines[i])[1]);

					var prop = {
						"curr_spin" : curr_spin,
						"send_again": send_again
					};

					events.push(package_event(source_id, "out", prop)); // from "out" port
				}
			}

			return events;
		}
	}

	xmlhttp.open("GET", filename, false); // TODO: false is deprecated
	xmlhttp.send();
	return xmlhttp.onreadystatechange();


	function package_event(source_id, port, properties) {
		var evt = {
			"port" : port,
			"id": source_id,
			"prop": properties // properties of source node that have changed due to this event
		}

		return evt;

	}
}

function display_initial_graph(data) {
	var width = window.innerWidth;
   	var height = window.innerHeight;

	var svg = d3.select("body")
				.append("svg")
				.attr("viewBox", "0 0 " + width + " " + height )
         		.attr("preserveAspectRatio", "xMidYMid meet");

	var simulation = d3.forceSimulation()
				    .force("link", d3.forceLink().id(function(d) { return d.id; }))
				    .force("charge", d3.forceManyBody())
				    .force("center", d3.forceCenter(width / 2, height / 2));

	var link = svg.append("g")
			    	.attr("class", "edges")
			    	.selectAll("line")
			    	.data(data.edges)
			    	.enter().append("line")
						      	.attr("stroke", "#cccccc");

	var node = svg.append("g")
			    .attr("class", "nodes")
			    .selectAll("circle")
			    .data(data.nodes)
			    .enter().append("circle")
			    .attr("r", 5)

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
}


var data = load_graph_instance("data/ising_spin_16_2.xml");
var events = load_graph_events("data/ising_spin_16_2_event.txt");

data.events = events;

display_initial_graph(data);