import networkx as nx

import xml.sax
import json
import sys, os
from collections import defaultdict

import xml.etree.ElementTree as ET
from lxml import etree

# from controller.graph.core import *
# from controller.graph.events import *
# from controller.graph.load_xml import *
from graph.core import *
from graph.events import *
from graph.load_xml import *



class MetisHandler():
	def __init__(self, graph, basedir, nodes_per_part):
		'''
		Metis input format:

		V E fmt ncon
		s w1 w2 ... wncon v1 e1 v2 e2 ... vk ek

		V E flags num_vertex_weights
		vertex_weights1 v2 w2 v3 w3 v4 w4...
		vertex_weights2 v3 w3 v4 w4 v5 w5...

		...

		in this particular configuration, only edge weights are taken into account
		vertices have no weights

		'''

		self.nodes_per_part = nodes_per_part
		self.graph = graph
		self.filename_base = basedir + self.graph.raw.graph_type.id + "_metis_input_"
		self.rows = [None] * (self.graph.number_of_nodes() + 1)
		self.flag = "001"
		self.num_node_weights = 0
		self.rows[0] = "{} {} {} {}".format(self.graph.number_of_nodes(), self.graph.number_of_edges(), self.flag, self.num_node_weights)

		self.set_nparts()
		self.set_nodes()
		self.set_edges()

	def set_nparts(self):
		nnodes = self.graph.number_of_nodes()
		self.nlevels = 1

		while nnodes > self.nodes_per_part:
			nnodes = nnodes // self.nodes_per_part
			self.nlevels += 1

		self.nparts = nnodes



	def set_nodes(self):
		self.nid_map = {}
		i = 1
		for id, dev in self.graph.nodes.iteritems():
			dev["nid"] = i
			self.nid_map[i] = id
			self.rows[i] = "" #{} {} {} ".format(dev["type"], dev["messages_sent"], dev["messages_received"])
			i += 1

	def set_edges(self):
		for id, edge in self.graph.edges.iteritems():
			src, dst = id.split(":")
			nsrc = self.graph.nodes[src]["nid"]
			ndst = self.graph.nodes[dst]["nid"]
			# workaround for half edge
			self.rows[nsrc] += "{} {} ".format(ndst, edge["messages"])
			self.rows[ndst] += "{} {} ".format(nsrc, edge["messages"])
			
	def write_metis_input_file(self, level = 0):
		input_file = open(self.filename(level), "w")
		for row in self.rows:
			input_file.write(row + "\n")

	def execute_metis(self):

		for i in range(self.nlevels):
			self.write_metis_input_file(i)
			os.system("gpmetis " + self.filename(i) + " " +  str(self.nparts))
			self.read_metis_partition(i) # TODO: partition levels

	def read_metis_partition(self, level = 0):
		i = 1
		with open(self.filename(level) + ".part." + str(self.nparts), "r") as f:
			for line in f:
				if level == 0:
					self.graph.nodes[self.nid_map[i]]["partition_" + str(level)] = line.strip()
				else:
					self.graph.nodes[self.nid_map[i]]["partition_" + str(level)] = self.graph.nodes[self.nid_map[i]]["partition_" + str(level - 1)] + "_" + line.strip()
				i += 1

	def filename(self, level):
		return self.filename_base + str(level)


class GraphBuilder():
	def __init__(self, graph_src, event_src):
		self.raw = load_graph(graph_src, graph_src)
		
		# networkx
		# partitioned node attributes: id n_type sent_msgs recv_msgs
		# partitioned edge attributes: to from weight/num_links messages
		# self.graph = nx.DiGraph()
		# self.graph.graph['node_weight_attr'] = ['type', 'messages_sent', 'messages_received']
		# self.graph.graph['edge_weight_attr'] = ['weight', 'messages']
		self.levels = 1

		self.type_map = {}
		self.set_type_map()

		self.nodes = {}
		self.set_device_instances()

		self.edges = {}
		self.set_edge_instances()

		event_writer = LogWriter()
		parseEvents(event_src, event_writer)
		self.events = event_writer.log
		self.event_pairs = event_writer.event_pairs

		self.set_node_attributes()
		self.set_edge_attributes()

		# self.add_nodes_to_graph()
		# self.add_edges_to_graph()

	def partition(self, n):
		(edgecuts, parts) = metis.part_graph(self.graph, n)
		print(parts)

	def number_of_nodes(self):
		return len(self.nodes)

	def number_of_edges(self):
		return len(self.edges)

	def add_nodes_to_graph(self):
		for id, node in self.nodes.iteritems():
			self.graph.add_node(id, node)

	def add_edges_to_graph(self):
		for id, edge in self.edges.iteritems():
			src, dst = id.split(":")
			self.graph.add_edge(src, dst, weight = edge["messages"]) # TODO: option to partition by num edges or messages

	def set_device_instances(self):
		i = 0
		for id, dev in self.raw.device_instances.iteritems():
			self.nodes[id] = {"type": self.type_map[dev.device_type.id], "messages_sent": 0, "messages_received": 0}
			i += 1

	def set_node_attributes(self):
		for id, evt in self.events.iteritems():
			if evt.type == "send":
				self.nodes[evt.dev]["messages_sent"] += 1
			elif evt.type == "recv":
				self.nodes[evt.dev]["messages_received"] += 1

	def set_edge_instances(self):
		for edge_id, edge in self.raw.edge_instances.iteritems():
			edge_id = min(edge.src_device.id, edge.dst_device.id) + ":" + max(edge.src_device.id, edge.dst_device.id)

			if edge_id in self.edges:
				self.edges[edge_id]["weight"] += 1
			else:
				self.edges[edge_id] = {"weight": 1, "messages": 1} # TODO: because edge weights must be > 0

	def set_edge_attributes(self):
		for evt_pair in self.event_pairs:
			send_id, recv_id = evt_pair.split(":")
			edge_id =  min(self.events[send_id].dev, self.events[recv_id].dev) + ":" + max(self.events[send_id].dev, self.events[recv_id].dev)
			self.edges[edge_id]["messages"] += 1

	def set_type_map(self):
		types = self.raw.graph_type.device_types
		
		i = 0
		for dev_type in types:
			self.type_map[dev_type] = i
			i += 1



# local_file = 'ising_spin_16_2'
# graph = GraphBuilder('../data/' + local_file + '.xml', '../data/' + local_file + '_event.xml')
# metis = MetisHandler(graph, "../data/metis_input", 5)
# metis.execute_metis()

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