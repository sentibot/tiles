class TilesMessaging{
    constructor(){}

    static displayFlashMessage(){
        return function (req, res, next) {
            // if message available, pass it to the context then clear it
            res.locals.flash = req.session.flash;
            delete req.session.flash;
            next();
        }
    }
}

module.exports = TilesMessaging;