function start() {
  // 2. Initialize the JavaScript client library.
  gapi.client.init({
    'apiKey': 'YOUR_API_KEY',
    // clientId and scope are optional if auth is not required.
    'clientId': 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
    'scope': 'profile',
  }).then(function() {
    // 3. Initialize and make the API request.
    return gapi.client.request({
      'path': 'https://people.googleapis.com/v1/people/me?requestMask.includeField=person.names',
    })
  }).then(function(response) {
    console.log(response.result);
  }, function(reason) {
    console.log('Error: ' + reason.result.error.message);
  });
};
// 1. Load the JavaScript client library.
gapi.load('client', start);



 // UPDATE TO USE YOUR PROJECT ID AND CLIENT ID
  var project_id = '605902584318';
  var client_id = '605902584318.apps.googleusercontent.com';

  var config = {
    'client_id': client_id,
    'scope': 'https://www.googleapis.com/auth/bigquery'
  };

  function runQuery() {
   var request = gapi.client.bigquery.jobs.query({
      'projectId': project_id,
      'timeoutMs': '30000',
      'query': 'SELECT state, AVG(mother_age) AS theav FROM [publicdata:samples.natality] WHERE year=2000 AND ever_born=1 GROUP BY state ORDER BY theav DESC;'
    });
    request.execute(function(response) {     
        console.log(response);
        var stateValues = [["State", "Age"]];
        $.each(response.result.rows, function(i, item) {
          var state = item.f[0].v;
          var age = parseFloat(item.f[1].v);
          var stateValue = [state, age];
          stateValues.push(stateValue);
        });  
        var data = google.visualization.arrayToDataTable(stateValues);
        var geochart = new google.visualization.GeoChart(
            document.getElementById('map'));
        geochart.draw(data, {width: 556, height: 347, resolution: "provinces", region: "US"});
    });
  }

  function auth() {
    gapi.auth.authorize(config, function() {
        gapi.client.load('bigquery', 'v2', runQuery);
        $('#client_initiated').html('BigQuery client initiated');
    });
    $('#auth_button').hide();
  }