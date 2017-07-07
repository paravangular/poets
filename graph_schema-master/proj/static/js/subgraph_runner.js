$(document).ready(function() {
	var data, events;

	reset_graph()


    function reset_graph() {
    	
	  	d3.selectAll("svg").remove();
	  	// slowing down?
		data = load_graph_instance("data/ising_spin_16_2.xml");
		load_initial_graph_state("data/ising_spin_16_2_event.xml", data);

		events = load_graph_events("data/ising_spin_16_2_event.xml");

		data.events = events;

		sessionStorage.setItem("data", JSON.stringify(data));
		graph = new SubGraph("body", data);
		graph.change_active_node("n_6_6");
		graph.create_adjacency_list();
		graph.create_subgraph();
		graph.draw();
    }
});