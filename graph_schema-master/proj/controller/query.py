# Imports the Google Cloud client library
from google.cloud import bigquery
from google.oauth2 import service_account
import schemas
import time
import os
import uuid

import cloudstorage as gcs
from google.appengine.api import app_identity

PROJECT = 'poets-172210'

class BiqQueryLoader():
	def __init__(self, dataset_name):
		credentials = service_account.Credentials.from_service_account_file('./keys/service-account.json')
		self.client = bigquery.Client(project = PROJECT, credentials=credentials)
		self.dataset_name = dataset_name
		self.dataset = self.find_dataset(dataset_name)

		print('Dataset {} created.'.format(self.dataset.name))
		self.create_tables()
		self.load_all_data()

	def find_dataset(self, dataset_name):
		for dataset in self.client.list_datasets():
			if dataset_name == dataset.name:
				return dataset

		return self.create_dataset(dataset_name)

	def create_dataset(self, dataset_name):
		dataset = self.client.dataset(dataset_name)
		dataset.create()

		return dataset

	def create_tables(self):
		self.create_table('graph_instances', schemas.GRAPH_INSTANCE_SCHEMA)
		self.create_table('device_instances', schemas.DEVICE_INSTANCE_SCHEMA)
		self.create_table('device_types', schemas.DEVICE_TYPE_SCHEMA)
		self.create_table('device_ports', schemas.DEVICE_PORT_SCHEMA)
		self.create_table('edge_instances', schemas.EDGE_INSTANCE_SCHEMA)
		self.create_table('events', schemas.EVENT_SCHEMA)


	def create_table(self, table_name, schema):
		if not self.dataset.table(table_name).exists():
			table = self.dataset.table(table_name, schema)
			table.create()
		else:
			print('Table {} already exists.'.format(table_name))

	def load_all_data(self):
		self.load_data_from_storage('graph_instances', 'graph_instances.csv')
		self.load_data_from_storage('device_instances', 'device_instances.csv')
		self.load_data_from_storage('device_types', 'device_types.csv')
		self.load_data_from_storage('device_ports', 'device_ports.csv')
		self.load_data_from_storage('device_ports', 'device_ports.csv')
		self.load_data_from_storage('events', 'events.csv')


	def load_data_from_storage(self, table_name, source):
		source = 'gs://' + os.environ.get('BUCKET_NAME', app_identity.get_default_gcs_bucket_name()) + '/' + source
		table = self.dataset.table(table_name)
		table.reload()
		job_name = str(uuid.uuid4())
		job = self.client.load_table_from_storage(job_name, table, source)

		job.begin()
		self.wait_for_job(job)

		print('Loaded {} rows into {}:{}.'.format(job.output_rows, self.dataset_name, table_name))


	def wait_for_job(self, job):
	    while True:
	        job.reload()
	        if job.state == 'DONE':
	            if job.error_result:
	                raise RuntimeError(job.errors)
	            return
	        time.sleep(1)

