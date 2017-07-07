import webapp2
from google.appengine.ext.webapp import template
from webapp2_extras import sessions

config = {}
config['webapp2_extras.sessions'] = {
    'secret_key': 'my_secret_key',
}

 
class ShowGraph(webapp2.RequestHandler):
    def get(self):
        temp_data = {}
        temp_path = 'templates/index.html'
        self.response.out.write(template.render(temp_path,temp_data))

class ShowSubgraph(webapp2.RequestHandler):
    def get(self):
        temp_data = {}
        temp_path = 'templates/subgraph.html'
        self.response.out.write(template.render(temp_path,temp_data))

class ShowDeviceDetails(webapp2.RequestHandler):
	def get(self):
		temp_data = {}
		temp_path = 'templates/device_details.html'
		self.response.write(template.render(temp_path, temp_data))

application = webapp2.WSGIApplication([
    ('/', ShowGraph),
    ('/subgraph', ShowSubgraph),
    ('/device_details', ShowDeviceDetails)
], debug=True, config=config)