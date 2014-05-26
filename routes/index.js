exports.index = function (req, res) {
    if (!req.user)
        res.redirect('/login');
    else
        res.redirect('/chat');
};

exports.register = function (req, res) {
    if (!req.user)
        res.render('register', {
            title: 'Rejerstracja - chat apka'
        });
    else
        res.redirect('/chat');
};

exports.login = function (req, res) {
    res.render('login', {
        title: 'Zaloguj - chat apka'
    });
};

exports.chat = function (req, res) {
    if (!req.user)
        res.redirect('/login');
    else
        res.render('chat', {
            title: 'Chat apka',
            name: req.user.username
        });
};

