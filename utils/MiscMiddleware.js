class MiscMiddleware {
    constructor() { }

    checkWorkers() {
        return function (req, res, next) {
            var cluster = require('cluster');
            if (cluster.isWorker) {
                console.log('CLUSTER: Worker %d received work', cluster.worker.id);
            }
            next();
        }
    }

    initMockData() {
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

    getMockDataForPartials() {
        var that = this;
        return function (req, res, next) {
            if (!res.locals.partials) {
                res.locals.partials = {};
            }
            res.locals.partials.tiles = that.initMockData();
            next();
        }
    }
}

module.exports = MiscMiddleware;
