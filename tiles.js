var express = require('express');
var http = require('http');
var ldb = require('./lib/ldb.js');
var formidable = require('formidable');
var Tile = require('./models/tile');
var Database = require('./db');
const teh = require('./utils/TilesErrorHandler');
const MiscMiddleware = require('./utils/MiscMiddleware');
const TilesMessaging = require('./utils/TilesMessaging');

var app = express();

app.set('port', process.env.PORT || 3000);

// Domain Error Handling
app.use(teh());

// configure express to use the handlebars view engine as default
var handlebars = require('express3-handlebars')
    .create({ defaultLayout: 'main', partialsDir: ['views/partials/'] });
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
app.use(require('cookie-parser')(require('./credentials').cookieSecret));
app.use(require('express-session')({
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
    cookie: { secure: app.get('env') === 'production' }
}));

app.use(function (req, res, next) {
    res.locals.showTests = app.get('env') !== 'production' && req.query.test === '1';
    next();
});

// Middleware for debugging/mock data
var misc = new MiscMiddleware();
app.use(misc.checkWorkers());
app.use(misc.getMockDataForPartials());
app.use(TilesMessaging.displayFlashMessage());

// DB Connection
var db = new Database(app);
db.connect();


//  ============ Mock Seed DB ============
Tile.find(function (err, tiles) {
    if (tiles.length) { return; }; // don't reseed if there are tiles in db already

    new Tile({ id: 1, name: 'Tile 1', length: 40, width: 20, inStock: true, material: '', um: '', price: 40000, tags: ['tag1', 'tag2', 'tag3'], icon: 'https://s7d1.scene7.com/is/image/TileShop/616148?$Product_Search$' }).save();
    new Tile({ id: 2, name: 'Tile 2', length: 35, width: 15, inStock: false, material: '', um: '', price: 34513, tags: ['tag4', 'tag5', 'tag6'], icon: 'https://s7d1.scene7.com/is/image/TileShop/650341?$Product_Search$' }).save();
    new Tile({ id: 3, name: 'Tile 3', length: 120, width: 60, inStock: true, material: '', um: '', price: 118465, tags: ['tag7', 'tag8', 'tag9'], icon: 'https://s7d1.scene7.com/is/image/TileShop/650340?$Product_Search$' }).save();
    new Tile({ id: 4, name: 'Tile 4', length: 50, width: 25, inStock: false, material: '', um: '', price: 83752, tags: ['tag10', 'tag11', 'tag12'], icon: 'https://s7d1.scene7.com/is/image/TileShop/650340?$Product_Search$' }).save();
});
//  ============ Mock Seed DB ============


// [******************** Mock Upload Function ********************]

function UploadImages() { }
UploadImages.prototype.save = function (cb) {
    cb();
};

// [******************** Mock Upload Function ********************]

// setup routes
app.get('/', function (req, res) {
    res.render('home', { quote: ldb.getQuote() });
});

app.get('/about', function (req, res) {
    res.render('about', { pageTestScript: '/qa/tests-about.js' });
});

app.get('/products', function (req, res) {
    Tile.find(function (err, tiles) {
        var context = {
            tiles: tiles.map(function (tile) {
                return {
                    id: tile.id,
                    name: tile.name,
                    length: tile.length,
                    width: tile.width,
                    price: tile.getPrice(),
                    inStock: tile.inStock,
                    icon: tile.icon
                };
            })
        };

        res.render('products', context);
    });
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

    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        if (err) {
            if (req.xhr) { //return json response if it was AJAX call
                return res.json({ error: 'Something went wrong while processing your request!' });
            }
            req.session.flash = {
                type: 'error',
                intro: 'Something went wrong while processing your request!',
                message: 'There was an error with the upload form'
            };

            return res.redirect(303, '/collections/tile-photos');
        }

        if (fields.name === '' || fields.email === '' || files === null) {
            if (req.xhr) { //return json response if it was AJAX call
                return res.json({ error: 'All fields are mandatory!' });
            }
            req.session.flash = {
                type: 'danger',
                intro: 'Validation error',
                message: 'All fields are mandatory!'
            };
            res.locals.flash = {
                type: 'danger',
                intro: 'Validation error',
                message: 'All fields are mandatory!'
            };


            return res.redirect(303, '/collections/tile-photos');
        }

        new UploadImages({ name: fields.name, docs: files }).save(function (error) {
            if (error) {
                if (req.xhr) { //return json response if it was AJAX call
                    return res.json({ error: 'Database error!' });
                }
                req.session.flash = {
                    type: 'error',
                    intro: 'Upload error!',
                    message: 'Failed to upload file!'
                };

                return res.redirect(303, '/collections/tile-photos');
            }
            // if everything is ok
            if (req.xhr) { //return json response if it was AJAX call
                return res.json({ success: true });
            }
            req.session.flash = {
                type: 'success',
                intro: 'Upload done!',
                message: 'File uploaded successfully!'
            }

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

if (require.main === module) {
    // if application is run directly, start server
    startServer();
} else {
    // if application is imported via require, export function;
    module.exports = startServer;
}
// app.listen(app.get('port'), function () {
//     console.log('Express started on localhost, listenign on port ' + app.get('port'));
// });