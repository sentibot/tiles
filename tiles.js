var express = require('express');
var ldb = require('./lib/ldb.js');

var app = express();

app.set('port', process.env.PORT || 3000);

var handlebars = require('express3-handlebars')
    .create({ defaultLayout: 'main', partialsDir:['views/partials/'] });

// configure express to use the handlebars view engine as default
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');


app.use(express.static(__dirname + '/public'));

app.use(function (req, res, next) {
    res.locals.showTests = app.get('env') !== 'production' && req.query.test === '1';
    next();
});

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

app.use(function (req, res, next) {
    if (!res.locals.partials) {
        res.locals.partials = {};
    }
    res.locals.partials.tiles = getTiles();
    next();
});

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

app.listen(app.get('port'), function () {
    console.log('Express started on localhost, listenign on port ' + app.get('port'));
});