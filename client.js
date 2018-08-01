const socket = io()
const state = {}
const board = [];

var data={};
data.event = 'SEARCH_EVENT';
data._id = '1234';
data.rest = 'newrestaurant';

var data2={};
data2.event = 'REVIEW_UPLOADED';
data2.user_id = '1234';
data2.review_id = '4321';
data2.dishname = 'sdaufph';
data2.rest_id = '4321';
data2.service = 1;
data2.ambience = 2;
data2.clean = 3;
data2.taste = 4;
data2.value = true;

var data3={};
data3.event = 'LIKED_REVIEW';
data3.user_id = '1234';
data3.uploader_id = '1322134'
data3.review_id = '4321';
data3.dishname = 'sdaufph';
data3.rest_id = '4321';
data3.service = 1;
data3.ambience = 2;
data3.clean = 3;
data3.taste = 4;
data3.value = true;

var data4={};
data4.event = 'FOLLOWED_RESTAURANT';
data4.user_id = '1234';
data4.rest_id = '1234';

var data5={};
data5.event = 'DISH_OPENED';
data5.user_id = '1234';
data5.dishname = '1322134'
data5.rest_id = '4321';
data5.category = 'sdaufph';
data5.fromsearch = false;
data5.fromfeed = true;



var handleClick1 = function handleClick1() {
	socket.emit('event',data2);
};

	socket.on('start', () => {
		setState();
		console.log("dsfdfs")
		// socket.emit('event',data3);

	})

	
	const setState = () => {

		ReactDOM.render(
			React.createElement('p',{},
				React.createElement('h1',{},`CONNECT 4`),
				React.createElement('h3',{},`Select the column number to put the symbol in the corresponding column`),
				// React.createElement('p',{},`Your symbol is ${symbol}`),
				React.createElement('input',{type: 'submit', id: 'b1',value: "CLICK HERE",onClick: handleClick1}),
			),
			document.getElementById('root')
			)
	}




		