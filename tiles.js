var express = require('express');

var app = express();

app.set('port', process.env.PORT || 3000);

var handlebars = require('express3-handlebars')
    .create({ defaultLayout: 'main' });

// configure express to use the handlebars view engine as default
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');


app.use(express.static(__dirname + '/public'));


var dinCont = ["Dynamic Content 1", "Dynamic Content 2", "Dynamic Content 3", "Dynamic Content 4", "Dynamic Content 5"]

// setup routes
app.get('/', function (req, res) {
    var rc = dinCont[Math.floor(Math.random() * dinCont.length)];
    res.render('home', {content: rc});
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
    console.error(err.stack);
    res.status(500);
    res.render('500');
});

app.listen(app.get('port'), function () {
    console.log('Express started on localhost, listenign on port ' + app.get('port'));
});