var express = require('express');
var qdb = require('./lib/quotes.js');

var app = express();

app.set('port', process.env.PORT || 3000);

var handlebars = require('express3-handlebars')
    .create({ defaultLayout: 'main' });

// configure express to use the handlebars view engine as default
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');


app.use(express.static(__dirname + '/public'));


// setup routes
app.get('/', function (req, res) {
    res.render('home', { quote: qdb.getQuote() });
});

app.get('/about', function (req, res) {
    res.render('about');
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