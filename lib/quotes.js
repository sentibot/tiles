var qdb = ["Dynamic Content 1", "Dynamic Content 2", "Dynamic Content 3", "Dynamic Content 4", "Dynamic Content 5"];

function getQuote(){
    var quote = qdb[Math.floor(Math.random() * qdb.length)]; 
    return quote;
}

exports.getQuote = getQuote;