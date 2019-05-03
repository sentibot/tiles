module.exports = function(){
    return function (req, res, next) {
        // create domain for incoming request
        var domain = require('domain').create();
    
        // add error event to this domain
        domain.on('error', function (err) {
            console.log('DOMAIN ERROR:\n', err.stack);
            try {
                // shotdown process in 5s
                setTimeout(function () {
                    console.error('Shuting down...');
                    process.exit(1);
                }, 5000);
    
                // disconnect worker from cluster
                var worker = require('cluster').worker;
                if (worker) {
                    worker.disconnect();
                }
    
                // stop taking new requests
                server.close();
                try {
                    // try to use express error route
                    next(err);
                } catch (error) {
                    // if it's not working try plain Node response
                    console.log('Express error mechanism failed: \n', err.stack);
                    res.status.code = 500;
                    res.setHeader('content-type', 'text/plain');
                    res.end('Server error');
                }
            } catch (error) {
                console.error('Unable to send 500 response', err.stack);
            }
        });
    
        // add objects to the domain
        domain.add(req);
        domain.add(res);
    
        // execute the rest of the request
        domain.run(next);
    }
}