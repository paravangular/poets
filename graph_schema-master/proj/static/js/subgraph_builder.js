function SubGraph(selector, data) {
	// d3 vars
	var width = window.innerWidth * 0.7;
   	var height = window.innerHeight * 0.98;
  	var _data = data;
  	var active_node = init_active_node();
  	var subgraph;
  	var adj = {};

  	var max_depth = 4;

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

	var tooltip = d3.select("body").append("div").attr("class", "tooltip");


    this.data = function(value) {
    	if(!arguments.length) {
        	return _data;
      	}
      	
      	_data = value;
      	return this;
   	}

   	this.draw = function() {

   	}

   	function init_active_node() {
   		// rank each node through num edges
   		// return max edges
   	}

   	function change_active_node(new_node) {
   		// called on new node double click
   		active_node = new_node;
   		redraw();
   	}

   	function create_adjacency_list() {
   		for (var i = 0; i < data.edges.length; i++) {
   			var node = adj[data.edges[i].source];

   			if (typeof(node) == 'undefined') {
   				adj[data.edges[i].source] = {}
   			}

   			adj[data.edges[i].source][data.edges[i].target] = true;
   		}// TODO: http://staff.vbi.vt.edu/maleq/papers/conversion.pdf 

   	}

   	function redraw() {
   		var depth = max_depth;

   		while (depth > 0) {
   			depth--;

   			
   		}
   		// bfs from new node
   		// TODO find better algo
   		// d3 update pattern
   	}
}