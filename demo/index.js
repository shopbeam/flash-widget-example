var static = require('node-static');

//
// Create a node-static server instance to serve the './public' folder
//
var file = new static.Server('./demo/public');
var port = process.env.PORT || 8084;


for (i = port; i <= (port + 1); i++) {
    require('http').createServer(function (request, response) {
        request.addListener('end', function () {
            file.serve(request, response);
        }).resume();
    }).listen(i);
    console.log('visit http://localhost:' + i);
}
