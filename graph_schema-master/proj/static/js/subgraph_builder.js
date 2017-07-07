function SubGraph(selector, data) {
	// d3 vars
	var width = window.innerWidth * 0.7;
   	var height = window.innerHeight * 0.98;
  	var _data = data;
  	var active_node = init_active_node();
  	var subgraph = {"nodes": [], "edges": []};
  	var adj = {};
    var simulating = false;

  	var max_depth = 5;

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
        console.log(subgraph)
        var simulation = d3.forceSimulation()
                    .force("link", d3.forceLink().id(function(d) { return d.id; }).distance(50).strength(1))
                    .force("charge", d3.forceManyBody())
                    .force("center", d3.forceCenter(width / 2, height / 2));

        link = g.append("g")
                        .attr("class", "edges")
                        .selectAll("line")
                        .data(subgraph.edges)
                        .enter().append("line")
                                    .attr("stroke", "#cccccc");

        node = g.append("g")
                    .attr("class", "nodes")
                    .selectAll(".device") // TODO: device shape
                    .data(subgraph.nodes)
                    .enter().append("path")
                    .attr("class", function(d) { return "device " + d.id })
                    .attr("d", d3.symbol().size(300).type(d3.symbolCircle))
                    // .attr("fill", function(d) { 
                    //     var selected = $("input[name='property']:checked").val();
                    //     return get_node_colour(selected, d.p[selected])
                    // })
                    .attr("stroke", "#FFFFFF")
                    .attr("stroke-width", "2px")
                    // .on("click", function(d) { 
                    //     tooltip
                    //       .style("display", "inline-block")
                    //       .html(show_node_state(d));

                    //     var tooltip_node = d3.select('.tooltip')._groups[0][0];

                    //     var tooltip_width =  tooltip_node.getBoundingClientRect().width;
                    //     var tooltip_height = tooltip_node.getBoundingClientRect().height;

                    //     tooltip.style("left", d3.event.pageX - tooltip_width / 2 + "px")
                    //         .style("top", d3.event.pageY - (tooltip_height + 20) + "px")

                    //     if (d3.select(this).classed("selected-node")) {
                    //         d3.select(this)
                    //             .classed("selected-node", false);

                    //     } else {
                    //         d3.select(".selected-node")
                    //             .classed("selected-node", false);

                    //         d3.select(this)
                    //             .classed("selected-node", true);
                    //     }
                    // })
                    // .on("dblclick", function(d) {
                    //     show_device_details(d);
                    // })
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

        simulation.nodes(subgraph.nodes)
                    .on("tick", ticked);

        simulation.force("link")
                    .links(subgraph.edges);

        function ticked() {
            link
                .attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });

            node.attr("transform", function (d) {return "translate(" + d.x + ", " + d.y + ")";});
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

    this.create_subgraph = function() {
        var depth = max_depth;

        // TODO: helper queue class because O(N)
        // TODO: change bfs to more efficient?
        var q = [];
        q.push(active_node);

        var nodes = new Set();

        var curr_depth = 0,
            remaining_nodes_at_curr = 1,
            next_remaining = 0;

        while (q.length != 0) {
            var curr = q.shift();
            nodes.add(curr);

            next_remaining += adj[curr].size;

            if ((remaining_nodes_at_curr -= 1) == 0) {
                if ((curr_depth += 1) > depth) { break; };
                remaining_nodes_at_curr = next_remaining;
                next_remaining = 0;
            }

            q = q.concat(Array.from(adj[curr]));
        }

        nodes.forEach(function(node) {
            subgraph.nodes.push({"id" : node});
        })

        for (var i = 0; i < subgraph.nodes.length; i++) {
            subgraph.edges.concat(find_edges_by_source_id(subgraph.nodes[i]));
        }

    }



   	this.change_active_node = function(new_node) {
   		// called on new node double click
   		active_node = new_node;
   	}


    function init_active_node() {
        // rank each node through num edges
        // return max edges
    }

   	this.create_adjacency_list = function() {
        // TODO: unconnected nodes
   		for (var i = 0; i < data.edges.length; i++) {
   			var node = adj[data.edges[i].source];

   			if (typeof(node) == 'undefined') {
   				adj[data.edges[i].source] = new Set();
   			}

   			adj[data.edges[i].source].add(data.edges[i].target);
   		}// TODO: http://staff.vbi.vt.edu/maleq/papers/conversion.pdf 
   	}

   	function redraw() {



   	}
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