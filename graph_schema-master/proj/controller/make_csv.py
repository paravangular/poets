import json

'''
Table Schemas
** BigQuery provides JSON functions so no schema needs to be provided

Graphs
	- id
	- type
	- properties : JSON string
	- metadata : JSON string

DeviceTypes
	- id
	- parent
	- state : JSON string / List
	- properties : JSON string / List
	- inputs : JSON string
	- outputs : JSON string
	- ports : JSON string
	- metadata

DeviceInstances
	- id
	- type
	- properties : JSON string
	- state : JSON string

EdgeInstances
	- sourceId
	- destId
	- sourcePort
	- destPort
	- properties : JSON string
	- state : JSON string

InitEvents
	- id
	- dev
	- time
	- elapsed
	- rts
	- seq
	- L
	- S

RecvEvents
	- id
	- sendEventId
	- dev
	- time
	- elapsed
	- rts
	- seq
	- port
	- L
	- S

SendEvents
	- id
	- dev
	- time
	- elapsed
	- rts
	- seq
	- port
	- cancel
	- fanout
	- L
	- S
	- M

Snapshots


'''
def make_graph_row(graph):
	id = graph.id
	graph_type = graph.graph_type
	properties = json.dumps(properties.elements_by_name())
	metadata = graph.metadata

	header = "id, type, properties, metadata"
	content = "{}, {}, {}, {}".format(id, graph_type, properties, metadata)

	return header + "\n" + content


def make_dev_instance_row(devices):
	header = "id, type, properties, metadata"
	content = ""

	for id, d in devices.iteritems():
		content += "{}, {}, {}, {}".format(d.id, d.device_type, json.dumps(d.properties.elements_by_name()), d.metadata)
	
	return header + "\n" + content


def make_edge_instance_row(edges):
	