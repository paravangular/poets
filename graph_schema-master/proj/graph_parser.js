function load_graph_instance(filename) {
	var xmlhttp = new XMLHttpRequest();
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

				events.recv.push(evt);
			}

			return events;
		}
	}

	xmlhttp.open("GET", filename, false); // TODO: false is deprecated
	xmlhttp.send();
	return xmlhttp.onreadystatechange();
}

var COLOURS = {
	"1": "#FF0000",
	"-1": "#00a1ff"
}


function force_graph(selector, data) {
	var width = window.innerWidth;
   	var height = window.innerHeight;
  	var _data = data
  	svg = d3.select("body")
      	.append("svg")
      	.attr("viewBox", "0 0 " + width + " " + height)
      	.attr("preserveAspectRatio", "xMidYMid meet");


    this.data = function(value) {
    	if(!arguments.length) {
        	return _data;
      	}
      	
      	_data = value;
      	return this;
   	}

   	this.draw = function() {
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
				    .attr("fill", function(d) { return COLOURS[d.p.spin]});


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
		        .attr("cy", function(d) { return d.y; })
		        .attr("fill", function(d) { console.log(d.p.spin); return COLOURS[d.p.spin]});
		}
   	}

   	

}

function update_dataset(data, evt) {
	var id = evt.dev;
	var p = evt.node_prop;

	var n = find_node_by_id(data.nodes, id);
	n.p = p;

	graph.data(data);
	// graph.draw();

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

var data = load_graph_instance("data/ising_spin_16_2.xml");
load_initial_graph_state("data/ising_spin_16_2_event.xml", data);

var events = load_graph_events("data/ising_spin_16_2_event.xml");

data.events = events;

// display_initial_graph(data);
var graph = new force_graph("body", data);
graph.draw();

for (var i = 0; i < data.events.send.length; i++) {
	setTimeout(update_dataset(data, data.events.send[i]), 100);
	
}