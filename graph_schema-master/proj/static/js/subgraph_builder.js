function SubGraph(selector, data) {
	// d3 vars
	var width = window.innerWidth * 0.7;
   	var height = window.innerHeight * 0.98;
  	var _data = data;
  	var active_node = init_active_node();
  	var subgraph = {"nodes": {}, "edges": []};
  	var adj = {};
    
    
  // logic vars
  var simulating = false;
    var prop_domain = [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY];
    var message_passing_time = 100;
    var symbol_size = 300;
    var last_event_time = get_last_event_time();
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
        // TODO: set boundary nodes to circular perimeter
     
        var simulation = d3.forceSimulation()
                    .force("link", d3.forceLink().id(function(d) { return d.id; }).distance(50).strength(1))
                    .force("charge", d3.forceManyBody())
                    .force("center", d3.forceCenter(width / 2, height / 2));

        link = g.append("g")
                        .attr("class", "edges")
                        .selectAll("line")
                        .data(subgraph.edges)
                        .enter().append("line")
                        .attr("stroke", "#cccccc")
                        .attr("class", function(d) { edge_class(d)});

        node = g.append("g")
                    .attr("class", "nodes")
                    .selectAll(".device")
                    .data(d3.values(subgraph.nodes))
                    .enter().append("path")
                    .attr("class", function(d) { return "device " + d.id })
                    .attr("d", d3.symbol().size(300).type(d3.symbolCircle))
                    .attr("fill", function(d) { 
                      if (d.id == active_node) {
                        return "red"
                      } else {

                          var selected = $("input[name='property']:checked").val();

                          if (typeof(selected) != 'undefined') {
                            return get_node_colour(selected, d.p[selected])
                          }

                          return "#000000";
                        }
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

        simulation.nodes(d3.values(subgraph.nodes))
                    .on("tick", ticked);

        simulation.force("link")
                    .links(subgraph.edges);

        function edge_class(edge) {
          return edge.source  + ":" + edge.target;
        }

        function ticked() {
            link
                .attr("x1", function(d) { return link_x(d.source); })
                .attr("y1", function(d) { return link_y(d.source); })
                .attr("x2", function(d) { return link_x(d.target); })
                .attr("y2", function(d) { return link_y(d.target); });

            node.attr("transform", function (d) {
                if (d.id == active_node) { 
                    if (d.x == width/2 && d.y == height/2) {
                      return "translate(0, 0)"
                    } else {
                      return "translate(" + width/2 + ", " + height/2 + ")"
                    }
                } else { return "translate(" + d.x + ", " + d.y + ")";}
            });
        }

        function link_x(node) {
          if (node.id == active_node) {
            return width / 2;
          } else {
            return node.x;
          }
        }

        function link_y(node) {
          if (node.id == active_node) {
            return height / 2;
          } else {
            return node.y;
          }
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
            subgraph.nodes[node] = data.nodes[node];
        })

        for (var node in subgraph.nodes) {
            subgraph.edges = subgraph.edges.concat(find_edges_within_subgraph(data.edges, node, nodes));
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
            setTimeout(function(){timeout_loop(i);}, 50);
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
    // TODO: disallow animation when force-directed graph is still moving
    var id = send_evt.dev;
    var p = send_evt.node_prop;


    var n = data.nodes[id];
    n.p = p;

    // TODO: find better way: use d3 merges?
    var source_dev = d3.select("." + id);

    var selected = $("input[name='property']:checked").val();

    source_dev.attr("fill", function(d) { 
      return get_node_colour(selected, n.p[selected]);
    });

      var start = get_symbol_centroid(source_dev);
      var ends = [];

    var recv_evts = find_recv_event(data.events, send_evt);
    for (var i = 0; i < recv_evts.length; i++) {
      var target_dev = d3.select("." + recv_evts[i].dev)
      ends.push(get_symbol_centroid(target_dev));

    }

    message_animation(start, ends);

      function get_symbol_centroid(circle) {
        var bibox = d3.select(circle).node().getBBox();

        var t = get_translation(d3.select(circle.node()).attr("transform")),
          x = t[0] + (bibox.x + bibox.width)/2 - bibox.width / 4,
          y = t[1] + (bibox.y + bibox.height)/2 - bibox.height / 4;
        return x + ", " + y;
    }

    function get_translation(transform) {
        var g = document.createElementNS("http://www.w3.org/2000/svg", "g")
        g.setAttributeNS(null, "transform", transform);
        var matrix = g.transform.baseVal.consolidate().matrix;
        
        return [matrix.e, matrix.f];
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


function find_edges_within_subgraph(edges, source_id, nodes) {
    var edgeList = []
    for (var i = 0; i < edges.length; i++) {
        if (edges[i].source == source_id && nodes.has(edges[i].target)) {
                edgeList.push(edges[i]);
        }
    }

    return edgeList;
}