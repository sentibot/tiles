var express = require('express');
var http = require('http');
var ldb = require('./lib/ldb.js');
var formidable = require('formidable');
var credentials = require('./credentials');
var cookies = require('cookie-parser');
var session = require('express-session');

var app = express();

app.set('port', process.env.PORT || 3000);

// [******************** Global Error Handling ********************] 

app.use(function(req, res, next){
    // create domain for incoming request
    var domain = require('domain').create();

    // add error event to this domain
    domain.on('error', function(err){
        console.log('DOMAIN ERROR:\n', err.stack);
        try {
            // shotdown process in 5s
            setTimeout(() => {
                console.error('Shuting down...')
                process.exit(1);
            }, 5000);

            // disconnect worker from cluster
            var worker = require('cluster').worker;
            if(worker){
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
});

// [******************** Global Error Handling ********************] 

var handlebars = require('express3-handlebars')
    .create({ defaultLayout: 'main', partialsDir: ['views/partials/'] });

// configure express to use the handlebars view engine as default
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

switch (app.get('env')) {
    case 'development':
        app.use(require('morgan')('dev'));
        break;
    case 'production':
        app.use(require('express-logger')({
            path: __dirname + '/log/requests.log'
        }));
        break;
}

app.use(express.static(__dirname + '/public'));
app.use(cookies(credentials.cookieSecret));
app.use(session());

app.use(function (req, res, next) {
    res.locals.showTests = app.get('env') !== 'production' && req.query.test === '1';
    next();
});

// [******************** Middlewere to check on workers ********************] 
app.use(function(req, res, next){
    var cluster = require('cluster');
    if(cluster.isWorker){
        console.log('CLUSTER: Worker %d received work', cluster.worker.id);
    }
    next();
});
// [******************** Middlewere to check on workers ********************] 


// [******************** Mock data for partial view ********************]
function getTiles() {
    return {
        tdata: [
            {
                name: 'Victoria Grey',
                tileUrl: 'https://www.tileshop.com/products/victoria-grey-rouen-stone-mosaic-wall-tile-616152?g2=material&c=marble&sc=wall',
                iconUrl: 'https://s7d1.scene7.com/is/image/TileShop/616148?$Product_Search$',
                tlength: '40',
                twidth: '20'
            },
            {
                name: 'Fressia Toros',
                tileUrl: 'https://www.tileshop.com/products/fressia-toros-black-marble-wall-tile-7-x-18-in-650341?g2=material&c=marble&sc=wall',
                iconUrl: 'https://s7d1.scene7.com/is/image/TileShop/650341?$Product_Search$',
                tlength: '50',
                twidth: '25'
            },
            {
                name: 'Vinica Mugla',
                tileUrl: 'https://www.tileshop.com/products/vinica-mugla-white-marble-architectural-wall-tile-12-in-650340?g2=material&c=marble&sc=wall',
                iconUrl: 'https://s7d1.scene7.com/is/image/TileShop/650340?$Product_Search$',
                tlength: '35',
                twidth: '15'
            }
        ]
    };
}
// [******************** Mock data for partial view ********************]

// [******************** Middlewere -> to be moved into the right place ********************]
app.use(function (req, res, next) {
    if (!res.locals.partials) {
        res.locals.partials = {};
    }
    res.locals.partials.tiles = getTiles();
    next();
});

app.use(function (req, res, next) {
    // if message available, pass it to the context then clear it
    res.locals.flash = req.session.flash;
    delete req.session.flash;
    next();
});
// [******************** Middlewere -> to be moved into the right place ********************]

// [******************** Mock Upload Function ********************]

function UploadImages() { };
UploadImages.prototype.save = function (cb) {
    cb();
}

// [******************** Mock Upload Function ********************]

// setup routes
app.get('/', function (req, res) {
    res.render('home', { quote: ldb.getQuote() });
});

app.get('/about', function (req, res) {
    res.render('about', { pageTestScript: '/qa/tests-about.js' });
});

app.get('/inspirations/virtualroom', function (req, res) {
    res.render('inspirations/virtualroom', { pageTestScript: '/../qa/tests-crosspage.js' });
});

app.get('/inspirations/request-rate', function (req, res) {
    res.render('inspirations/request-rate');
});

// [******************** Collection routes ********************]
app.get('/collections/tile-photos', function (req, res) {
    var now = new Date();
    res.render('collections/tile-photos', { year: now.getFullYear(), month: now.getMonth() });
});

app.post('/collections/tile-photos', function (req, res) {
    req.session.flash = {
        type: '',
        intro: '',
        message: ''
    }
    res.locals.flash = {
        type: '',
        intro: '',
        message: ''
    }
    var isAjaxReq = req.xhr;

    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        var formValues = {
            name: fields.name,
            email: fields.email
        };

        if (err) {
            if (isAjaxReq) { //return json response if it was AJAX call
                return res.json({ error: 'Error - Something wrong!' });
            }
            res.locals.flash.type = 'error';
            res.locals.flash.intro = 'Error - Something wrong!';
            res.locals.flash.message = 'There was an error with the upload form';
            return res.render('collections/tile-photos', { form: formValues }); // do not refresh page if validation failed
            // return res.redirect(303, '/collections/tile-photos');
        }

        if (fields.name === '' || fields.email === '') {
            if (isAjaxReq) { //return json response if it was AJAX call
                return res.json({ error: 'Invalid fields!' });
            }
            res.locals.flash.type = 'danger';
            res.locals.flash.intro = 'Validation error';
            res.locals.flash.message = 'Fields Name and Email are mandatory';
            return res.render('collections/tile-photos', { form: formValues }); // do not refresh page if validation failed
            // return res.redirect(303, '/collections/tile-photos');
        }

        new UploadImages({ name: fields.name, docs: files }).save(function (error) {
            if (error) {
                if (isAjaxReq) { //return json response if it was AJAX call
                    return res.json({ error: 'Database error!' });
                }
                req.session.flash.type = 'error';
                req.session.flash.intro = 'Database error!';
                req.session.flash.message = 'Failed to upload file!';
                return res.render('collections/tile-photos'); // do not refresh page if validation failed
                // return res.redirect(303, '/collections/tile-photos');
            }
            // if everything is ok
            if (isAjaxReq) { //return json response if it was AJAX call
                return res.json({ success: true });
            }
            req.session.flash.type = 'success';
            req.session.flash.intro = 'Upload done!';
            req.session.flash.message = 'File uploaded successfully!';
            return res.redirect(303, '/collections/tile-photos'); // redirect to same page now | implement a custom page in the future
        });
    });
});

// [******************** Collection routes ********************]

// custom 404 page
app.use(function (req, res) {
    res.status(404);
    res.render('404');
});

// custom 500 page
app.use(function (error, req, res, next) {
    console.error(error.stack);
    res.status(500);
    res.render('500');
});

var server;
function startServer() {
    server = http.createServer(app).listen(app.get('port'), function () {
        console.log('Express started in ' + app.get('env') + ' mode on http://localhost:' + app.get('port') + '; Press Ctrl-C to terminate.');
    });
}

if(require.main === module){
    // if application is run directly, start server
    startServer();
}else{
    // if application is imported via require, export function;
    module.exports = startServer;
}
// app.listen(app.get('port'), function () {
//     console.log('Express started on localhost, listenign on port ' + app.get('port'));
// });