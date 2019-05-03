var credentials = require('./credentials');
var mongoose = require('mongoose');
var options = {
     keepAlive: 1,
     useNewUrlParser: true
}

class Database {
    constructor(app) {
        this.app = app;
    }
    connect() {
        switch (this.app.get('env')) {
            case 'development':
                mongoose.connect(credentials.mongo.development.connectionString, options);
                break;
            case 'production':
                mongoose.connect(credentials.mongo.production.connectionString, options);
                break;
            default:
                throw new Error('Execution environment ' + this.app.get('env') + ' not found');
        }
    }
}


module.exports = Database;

