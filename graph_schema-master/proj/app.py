import os
from google.appengine.ext.webapp import template
from webapp2_extras import sessions
import webapp2


class MainPage(webapp2.RequestHandler):


class GraphPage(webapp2.RequestHandler):
    def get(self):
        temp_data = {}
        temp_path = 'templates/index.html'
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
    ('/graph', GraphPage)
    ('/subgraph', SubgraphPage),
    ('/device_details', DeviceDetailsPage)
], debug=True)