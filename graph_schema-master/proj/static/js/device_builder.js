var dev = sessionStorage.getItem("active_device");
var data = JSON.parse(sessionStorage.getItem("data"));
sessionStorage.removeItem('data'); // clearing unused data

function get_device_events(dev_id) {

	dev_send_events = data.events.send.filter(involves_device);
	dev_recv_events = data.events.recv.filter(involves_device);

	dev_events = dev_send_events.concat(dev_recv_events).sort(compare_event_id);

	console.log(dev_events);

	function involves_device(ed) {
		return ed.dev === dev_id; 
	}

	function compare_event_id(evt1, evt2) {
		var id1 = parseInt(evt1.eventId);
		var id2 = parseInt(evt2.eventId);

		if (id1 < id2) {
			return -1;
		}

		if (id1 > id2) {
			return 1;
		}

		return 0;
	}

}

get_device_events(dev);