import os 

from google.appengine.ext.webapp import template
from webapp2_extras import sessions
import logging
import webapp2
from google.cloud import bigquery

import controller.make_csv
# import controller.query

from google.appengine.api import app_identity

config = {}
config['webapp2_extras.sessions'] = {
    'secret_key': 'my-super-secret-session-key',
}

class BaseHandler(webapp2.RequestHandler):
    def dispatch(self):
        self.session_store = sessions.get_store(request=self.request)
        try:
            webapp2.RequestHandler.dispatch(self)
        finally:
            self.session_store.save_sessions(self.response)

    @webapp2.cached_property
    def session(self):
        return self.session_store.get_session()

        
class MainPage(webapp2.RequestHandler):
    def get(self):
        temp_data = {}
        temp_path = 'templates/main.html'
        self.response.out.write(template.render(temp_path,temp_data))

#     def post(self):
#         # local_file = self.request.get('filename')
#         # local = self.request.get('local')

#         # if local:
#         #     # make_csv.make_database('data/' + filename + '.xml', 'data/' + filename + '_event.xml')
#         #     # loader = query.BiqQueryLoader(filename)
#         # else:
#         #     graph_xml = self.request.get('graph_xml')
#         #     event_xml = self.request.get('event_xml')


# class UploadHandler(webapp2.RequestHandler):
#     def get(self):
#         bucket_name = os.environ.get(
#             'BUCKET_NAME', app_identity.get_default_gcs_bucket_name())

#         self.response.headers['Content-Type'] = 'text/plain'
#         self.response.write(
#             'Demo GCS Application running from Version: {}\n'.format(
#                 os.environ['CURRENT_VERSION_ID']))
#         self.response.write('Using bucket name: \n\n'.format(bucket_name))

#     def create_file(self, filename):
#         """Create a file."""

#         self.response.write('Creating file {}\n'.format(filename))

#         # The retry_params specified in the open call will override the default
#         # retry params for this particular file handle.
#         write_retry_params = cloudstorage.RetryParams(backoff_factor=1.1)
#         with cloudstorage.open(
#             filename, 'w', content_type='text/plain', options={
#                 'x-goog-meta-foo': 'foo', 'x-goog-meta-bar': 'bar'},
#                 retry_params=write_retry_params) as cloudstorage_file:
#                     cloudstorage_file.write('abcde\n')
#                     cloudstorage_file.write('f'*1024*4 + '\n')
#         self.tmp_filenames_to_clean_up.append(filename)


class GraphPage(webapp2.RequestHandler):
    def get(self):
        temp_data = {}
        temp_path = 'templates/graph.html'
        self.response.out.write(template.render(temp_path,temp_data))

class SubgraphPage(webapp2.RequestHandler):
    def get(self):
        temp_data = {}
        temp_path = 'templates/subgraph.html'
        self.response.out.write(template.render(temp_path,temp_data))

class DeviceDetailsPage(webapp2.RequestHandler):
	def get(self):
		temp_data = {}
		temp_path = 'templates/device_details.html'
		self.response.write(template.render(temp_path, temp_data))

application = webapp2.WSGIApplication([
    ('/', MainPage),
    ('/graph', GraphPage),
    ('/subgraph', SubgraphPage),
    ('/device_details', DeviceDetailsPage)
], debug=True, config=config)