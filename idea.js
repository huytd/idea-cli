;(function() {
'use strict';

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(__dirname + '/idea.db');
var colors = require('colors');
var emoji = require('node-emoji').emoji;

function Idea() {
}

Idea.prototype.clear = function() {
    process.stdout.write('\u001B[2J\u001B[0;0f');
}

Idea.prototype.list = function() {
    this.clear();
    db.all('SELECT * FROM ideas', function(err, row) {
        if (err != null) {
        } else {
            console.log('Ideas List:'.green.inverse.bold);
            row.map(function(i){
                var before = emoji.white_medium_small_square;
                if (i.important == 1) {
                    before = emoji.exclamation;
                }
                var title = before + '  ' + (i.id + ') ').grey + i.title.white.bold;
                if (i.checked == 1) {
                    title = emoji.ballot_box_with_check + '  ' + (i.title).grey;
                }
                console.log(title);
            });
        }
    });
}

Idea.prototype.initDB = function() {
    // Database initialization
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='ideas'",
    function(err, rows) {
        if(err !== null) { }
        else if(rows === undefined) {
            db.run('CREATE TABLE "ideas" ' +
            '("id" INTEGER PRIMARY KEY AUTOINCREMENT, ' +
            '"title" VARCHAR(255), ' +
            '"important" INTEGER, ' +
            '"parent" INTEGER, ' +
            '"checked" INTEGER)', function(err) {
                if(err !== null) { }
            });
        }
    });
}

Idea.prototype.createItem = function(params) {
    var idea = params.slice(3).join(' ');
    db.run('INSERT INTO ideas (title, important, parent, checked) VALUES("' + idea + '", 0, 0, 0)', function(err) { });
    this.list();
}

Idea.prototype.markDone = function(params) {
    var idea = params.slice(3).join(' ');
    if (isNaN(idea)) {
        db.run('UPDATE ideas SET checked = "1" WHERE title LIKE "%' + idea + '%"', function(err) { });
    } else {
        db.run('UPDATE ideas SET checked = "1" WHERE id = "' + idea + '"', function(err) { });
    }
    this.list();
}

Idea.prototype.markImportant = function(params) {
    var idea = params.slice(3).join(' ');
    if (isNaN(idea)) {
        db.run('UPDATE ideas SET important = "1" WHERE title LIKE "%' + idea + '%"', function(err) { });
    } else {
        db.run('UPDATE ideas SET important = "1" WHERE id = "' + idea + '"', function(err) { });
    }
    this.list();
}

Idea.prototype.deleteItem = function(params) {
    var idea = params.slice(3).join(' ');
    if (isNaN(idea)) {
        db.run('DELETE FROM ideas WHERE title LIKE "%' + idea + '%"', function(err) { });
    } else {
        db.run('DELETE FROM ideas WHERE id="' + idea + '"' , function(err) { });
    }
    this.list();
}

Idea.prototype.clearAll = function(params) {
    db.run('DELETE FROM sqlite_sequence WHERE name="ideas";' , function(err) { });
    db.run('DELETE FROM ideas;' , function(err) { });
    this.list();
}

Idea.prototype.displayHelp = function() {
    this.clear();
    console.log("Command list:\n".bold.underline);
    console.log("   " + "list".green + "\t\t\t List all items");
    console.log("   " + "add".green + "/".reset + "a".green + "/".reset + "+".green + "\t\t Add new item");
    console.log("   " + "!".green + "/".reset + "i".green + "\t\t\t Mark item as important");
    console.log("   " + "del".green + "/".reset + "-".green + "/".reset + "x".green + "\t\t Delete an item by text or id");
    console.log("   " + "done".green + "/".reset + "d".green + "/".reset + "ok".green + "/".reset + ".".green + "\t\t Check an item is done by text or id");
    console.log("   " + "clear".green + "/".reset + "reset".green + "\t\t Clear all item");
    console.log("   " + "blah".green + "\t\t\t Display this help message " + emoji.kissing_smiling_eyes);
    console.log();
}

Idea.prototype.start = function(params) {
    this.initDB();

    var action = params[2] || 'list';

    switch (action) {
        case 'list':
            this.list();
            break;

        case 'a':
        case '+':
        case 'add':
            this.createItem(params);
            break;

        case '.':
        case 'd':
        case 'ok':
        case 'done':
            this.markDone(params);
            break;

        case 'i':
        case '!':
            this.markImportant(params);
            break;

        case 'del':
        case 'x':
        case '-':
            this.deleteItem(params);
            break;

        case 'reset':
        case 'clear':
            this.clearAll();
            break;

        default:
            this.displayHelp();
            break;
    }
}

module.exports = Idea;

})();
