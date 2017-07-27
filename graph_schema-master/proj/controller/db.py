import sqlite3

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

db = sqlite3.connect('../data/mydb')

'''
SCHEMA

device_partitions
devices
	- device id
	- type
	- messages_sent
	- messages_received
device_properties
	- properties (for every device)
device_states: device state at every change
	- id
	- time
	- states




'''

class DBBuilder():
	def __init__(self, graph_src, event_src):
		self.graph = GraphBuilder(graph_src, event_src)
		metis = MetisHandler(self.graph, "../data/metis_input", 5)
		metis.execute_metis()

		self.cursor = db.cursor()

	def device_partitions(self):
		fields = []
		fields.append(Field("id", "string", set(["key"])))
		fields.append(Field("partition", "int", set(["not null"])))

		self.create_table_query("device_partitions", fields)

		entries = []
		for id, node in self.graph.nodes:
			entries.append((id, node["partition"]))

		cursor.executemany(''' INSERT INTO device_partitions(id, partition) VALUES(?,?)''', entries)



	def devices(self):
		fields = []
		fields.append(Field("id", "string", set(["key"])))
		fields.append(Field("type", "int", set(["not null"])))
		fields.append(Field("messages_sent", "int", set(["not null"])))
		fields.append(Field("messages_received", "int", set(["not null"])))

		self.create_table_query("devices", fields)

	def device_properties(self):
		fields = []
		fields.append(Field("id", "string", set(["key"])))

		types = self.graph.raw.graph_type.device_types
		for id, dev_type in types.iteritems():
			for prop in dev_type.properties.elements_by_index:
				fields.append(Field(prop.name, prop.type))

		self.create_table_query("device_properties", fields)

	def device_states(self):
		fields = []
		fields.append(Field("id", "string", set(["key"])))
		fields.append(Field("time", "integer", set(["not null"])))

		types = self.graph.raw.graph_type.device_types
		for id, dev_type in types.iteritems():
			for state in dev_type.state.elements_by_index:
				fields.append(Field(state.name, state.type))

		self.create_table_query("device_states", fields)

	def create_table_query(self, table_name, fields):
		query = "CREATE TABLE " + table_name + "("
		for f in fields:
			if not first:
				query += ", "
			query += f.get()

		query += ")"


class Field():
	def __init__(self, name, data_type, properties = None):
		self.name = name
		self.type = self.parse_type(data_type)
		self.properties = self.parse_properties(properties)

	def get(self):
		return self.name + " " + self.type + " " + self.properties

	def parse_properties(self, prop):
		if prop is None:
			return ""

		res = []
		if "key" in properties:
			res.append("PRIMARY KEY")
		
		if "unique" in properties:
			res.append("UNIQUE")

		if "not null" in properties:
			res.append("NOT NULL")

		return res.join(" ")


	def parse_type(self, data_type):
		if data_type == "float":
			return "REAL"
		elif "int" in data_type:
			return "INTEGER"
		elif data_type == "string":
			return "TEXT"
		else:
			return "BLOB"


local_file = 'ising_spin_16_2'
graph = load_graph('../data/' + local_file + '.xml', '../data/' + local_file + '.xml')
