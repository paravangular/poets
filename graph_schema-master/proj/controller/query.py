# Imports the Google Cloud client library
from google.cloud import bigquery
import schemas
import time

class BiqQueryLoader():
	def __init__(self, dataset_name):
		self.client = bigquery.Client()
		self.dataset_name = dataset_name
		self.dataset = self.create_dataset(dataset_name)
		self.create_tables(dataset_name)
		load_all_data(dataset_name)

	def create_dataset(self, dataset_name):
		dataset = self.client.dataset(dataset_name)
		dataset.create()

		print('Dataset {} created.'.format(self.dataset.name))
		return dataset

	def create_tables(self):
		self.create_table(self.dataset, 'graph_instances', schemas.GRAPH_INSTANCE_SCHEMA)
		self.create_table(self.dataset, 'device_instances', schemas.DEVICE_INSTANCE_SCHEMA)
		self.create_table(self.dataset, 'device_types', schemas.DEVICE_TYPE_SCHEMA)
		self.create_table(self.dataset, 'device_ports', schemas.DEVICE_PORT_SCHEMA)
		self.create_table(self.dataset, 'edge_instances', schemas.EDGE_INSTANCE_SCHEMA)
		self.create_table(self.dataset, 'events', schemas.EVENT_SCHEMA)


	def create_table(self, table_name, schema):
		if not self.dataset.table(table_name).exists():
			table = self.dataset.table(table_name, schema)
			table.create()
		else:
			print('Table {} already exists.'.format(table_name))

	def load_all_data(self):
		self.load_data_from_file('graph_instances', 'data/graph_instances.csv')
		self.load_data_from_file('device_instances', 'data/device_instances.csv')
		self.load_data_from_file('device_types', 'data/device_types.csv')
		self.load_data_from_file('device_ports', 'data/device_ports.csv')
		self.load_data_from_file('device_ports', 'data/device_ports.csv')
		self.load_data_from_file('events', 'data/events.csv')


	def load_data_from_file(self, table_name, source_file_name):
	    table = self.dataset.table(table_name)

	    table.reload()

	    with open(source_file_name, 'rb') as source_file:
	        job = table.upload_from_file(
	            source_file, source_format='text/csv', skip_leading_rows=1, field_delimiter="|")

	    self.wait_for_job(job)

	    print('Loaded {} rows into {}:{}.'.format(
	        job.output_rows, self.dataset_name, table_name))


	def wait_for_job(self, job):
	    while True:
	        job.reload()
	        if job.state == 'DONE':
	            if job.error_result:
	                raise RuntimeError(job.errors)
	            return
	        time.sleep(1)

loader = BiqQueryLoader('ising_spin_16_2')
