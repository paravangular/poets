import networkx as nx
import metis
import xml.sax
import json
import sys
from collections import defaultdict

import xml.etree.ElementTree as ET
from lxml import etree

# from controller.graph.core import *
# from controller.graph.events import *
# from controller.graph.load_xml import *
from graph.core import *
from graph.events import *
from graph.load_xml import *

class NetworkXBuilder():
	def __init__(self, graph_src, event_src):
		self.raw_graph = load_graph(graph_src, graph_src)
		
		# networkx
		# partitioned node attributes: id n_type sent_msgs recv_msgs
		# partitioned edge attributes: to from weight/num_links messages
		self.graph = nx.DiGraph()
		self.graph.graph['node_weight_attr'] = ['type', 'messages_sent', 'messages_received']
		# self.graph.graph['edge_weight_attr'] = ['weight', 'messages']

		self.type_map = {}
		self.set_type_map()

		self.device_instances = {}
		self.set_device_instances()

		self.edges = {}
		self.set_edge_instances()

		event_writer = LogWriter()
		parseEvents(event_src, event_writer)
		self.events = event_writer.log
		self.event_pairs = event_writer.event_pairs

		self.set_node_attributes()
		self.set_edge_attributes()

		self.add_nodes_to_graph()
		self.add_edges_to_graph()

		# self.metis_graph = metis.networkx_to_metis(self.graph)
	def write_metis_input(self):
		pass	

	def partition(self, n):
		(edgecuts, parts) = metis.part_graph(self.graph, n)
		print(parts)

	def add_nodes_to_graph(self):
		for id, node in self.device_instances.iteritems():
			self.graph.add_node(id, node)

	def add_edges_to_graph(self):
		for id, edge in self.edges.iteritems():
			src, dst = id.split(":")
			self.graph.add_edge(src, dst, weight = edge["messages"])

	def set_device_instances(self):
		i = 0
		for id, dev in self.raw_graph.device_instances.iteritems():
			self.device_instances[id] = {"type": self.type_map[dev.device_type.id], "messages_sent": 0, "messages_received": 0}
			i += 1

	def set_node_attributes(self):
		for id, evt in self.events.iteritems():
			if evt.type == "send":
				self.device_instances[evt.dev]["messages_sent"] += 1
			elif evt.type == "recv":
				self.device_instances[evt.dev]["messages_received"] += 1

	def set_edge_instances(self):
		for edge_id, edge in self.raw_graph.edge_instances.iteritems():
			edge_id = edge.src_device.id + ":" + edge.dst_device.id

			if edge_id in self.edges:
				self.edges.edge_id.weight += 1
			else:
				self.edges[edge_id] = {"weight": 1, "messages": 0}

	def set_edge_attributes(self):
		for evt_pair in self.event_pairs:
			send_id, recv_id = evt_pair.split(":")
			edge_id = self.events[send_id].dev + ":" + self.events[recv_id].dev
			self.edges[edge_id]["messages"] += 1

	def set_type_map(self):
		types = self.raw_graph.graph_type.device_types
		
		i = 0
		for dev_type in types:
			self.type_map[dev_type] = i
			i += 1



local_file = 'ising_spin_16_2'
graph = NetworkXBuilder('../data/' + local_file + '.xml', '../data/' + local_file + '_event.xml')
graph.partition(3)



'''

create a partition for every event timestamp (if possible, if not, aggregate event timestamp)
	- combine events - aggregate by "seq" or "time" 1000
	- use --snapshot queue_sim/epoch_sim
	- list of events occurring between each snapshot

main view level 0:
	- biggest partition (4 levels ~ 100 nodes each, one tenth of all events aggregate)
	- 10 steps timestamp explorer ("from time a to b")
	- user can click on a node cluster, gets taken to subview

subview level 1:
	- one hundredth of all events aggregate stepper

subview level 2:
	- min(one thousandth of all events aggregate, 100) events



node weights: number of messages sent/received/both
edge weights: number of messages sent along edge (bidirectional)



TABLES
up to 3 partition levels x 10 snapshots: aggregate/average/sum properties of devices in each partition (integers only)
	level_0_time_0 level_0_time_1 ...
	level_1_time_0 ...

deepest level:
	device_instance: stores devices after init
	events: all events, can filter events based on time so no need for separate tables


SCHEMA
device_instance
id type [properties_type_1 properties_type_2...] [state_type_1 state_type_2...] msg_sent msg_recv

'''