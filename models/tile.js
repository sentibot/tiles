var mongoose = require('mongoose');

var tileSchema = mongoose.Schema({
    id: Number,
    name: String,
    length: Number,
    width: Number,
    inStock: Boolean,
    material: String,
    um: String,
    price: Number,
    tags: [String],
    icon: String
});

tileSchema.methods.getPrice = function(){
    return '$' + (this.price / 100).toFixed(2);
};

var Tile = mongoose.model('Tile', tileSchema);

module.exports = Tile;