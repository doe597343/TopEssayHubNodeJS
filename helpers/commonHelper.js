module.exports.randomString = (len , charset) =>{
    charset = charset || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var randomString = '';
    for (var i = 0; i < len; i++) {
        var randomPos = Math.floor(Math.random() * charset.length);
        randomString += charset.substring(randomPos,randomPos + 1);
    }
    return randomString;
}

module.exports.connRelease = (connection) =>{
    connection.on('release', function (connection) {
       
     });
}
