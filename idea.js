;(function() {
'use strict';

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(__dirname + '/idea.db');
var colors = require('colors');
var emoji = require('node-emoji').emoji;
var config = require('nconf');
var fs = require('fs');

function Idea() {
    config.file({ file: __dirname + '/config.json' });
    this.lastSelectedParent = config.get('lastSelectedParent') || 0;
    this.selectedParent = config.get('selectedParent') || 0;
    this.selectedParentTitle = config.get('selectedParentTitle') || "";
}

Idea.prototype.clear = function() {
    process.stdout.write('\u001B[2J\u001B[0;0f');
}

Idea.prototype.list = function() {
    this.clear();
    var query = 'SELECT * FROM ideas WHERE parent = "' + this.selectedParent + '"';
    var self = this;
    db.all(query, function(err, row) {
        if (err != null) {
        } else {
            console.log('Ideas List:'.green.inverse.bold + ' ' + self.selectedParentTitle.white.underline);
            row.map(function(i){
                var before = emoji.white_medium_small_square;
                if (i.important == 1) {
                    before = emoji.exclamation;
                }
                var title = before + '  ' + (i.id + ') ').grey + i.title.white.bold;
                if (i.checked == 1) {
                    title = emoji.ballot_box_with_check + '  ' +  (i.id + ') ').grey + (i.title).grey;
                }
                var query_count = 'SELECT COUNT(*) AS count FROM ideas WHERE parent = "' + i.id + '"';
                db.all(query_count, function(err, result){
                    var counter = "";
                    if (result[0].count > 0) {
                        counter = (' (' + result[0].count + ')').bold;
                        if (i.checked != 1) {
                            counter = counter.yellow;
                        } else {
                            counter = counter.grey;
                        }
                    }
                    console.log(title + counter);
                });
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
    db.run('INSERT INTO ideas (title, important, parent, checked) VALUES("' + idea + '", 0, "' + this.selectedParent + '", 0)', function(err) { });
    this.list();
}

Idea.prototype.markDone = function(params) {
    var idea = params.slice(3).join(' ');
    var query = 'SELECT * FROM ideas WHERE id="' + idea + '"';
    if (isNaN(idea)) {
        query = 'SELECT * FROM ideas WHERE title LIKE "%' + idea + '%"';
    }
    var self = this;
    db.all(query, function(err, row) {
        var itemToUpdate = row[0];
        db.run('UPDATE ideas SET checked = "1" WHERE id = "' + itemToUpdate.id + '" OR parent = "' + itemToUpdate.id + '"', function(err) { });
        self.list();
    });
}

Idea.prototype.markImportant = function(params) {
    var idea = params.slice(3).join(' ');
    var query = 'SELECT * FROM ideas WHERE id="' + idea + '"';
    if (isNaN(idea)) {
        query = 'SELECT * FROM ideas WHERE title LIKE "%' + idea + '%"';
    }
    var self = this;
    db.all(query, function(err, row) {
        var itemToUpdate = row[0];
        db.run('UPDATE ideas SET important = "1" WHERE id = "' + itemToUpdate.id + '" OR parent = "' + itemToUpdate.id + '"', function(err) { });
        self.list();
    });
}

Idea.prototype.deleteItem = function(params) {
    var idea = params.slice(3).join(' ');
    var query = 'SELECT * FROM ideas WHERE id="' + idea + '"';
    if (isNaN(idea)) {
        query = 'SELECT * FROM ideas WHERE title LIKE "%' + idea + '%"';
    }
    var self = this;
    db.all(query, function(err, row) {
        var itemToDelete = row[0];
        db.run('DELETE FROM ideas WHERE id="' + itemToDelete.id + '" OR parent="' + itemToDelete.id + '"' , function(err) { });
        if (itemToDelete.id == self.selectedParent) {
            self.selectPrevious();
        } else {
            self.list();
        }
    });
}

Idea.prototype.clearAll = function(params) {
    db.run('DELETE FROM sqlite_sequence WHERE name="ideas";' , function(err) { });
    db.run('DELETE FROM ideas;' , function(err) { });
    this.list();
}

Idea.prototype.selectPrevious = function(params) {
    var id = this.lastSelectedParent;
    var query = "";
    if (isNaN(id)) {
        query = 'SELECT * FROM ideas WHERE title LIKE "%' + id + '%"';
    } else {
        query = 'SELECT * FROM ideas WHERE id="' + id + '"';
    }
    var self = this;
    db.all(query, function(err, row) {
        var item = {
            id: 0,
            title: "",
            parent: 0
        };
        if (row.length > 0) item = row[0];
        self.lastSelectedParent = item.parent;
        config.set('lastSelectedParent', self.lastSelectedParent);
        self.selectedParent = item.id;
        config.set('selectedParent', self.selectedParent);
        self.selectedParentTitle = item.title;
        config.set('selectedParentTitle', self.selectedParentTitle);
        self.saveConfig();
        self.list();
    });
}

Idea.prototype.selectItem = function(params) {
    var id = params.slice(3).join(' ');
    var query = "";
    if (isNaN(id)) {
        query = 'SELECT * FROM ideas WHERE title LIKE "%' + id + '%" AND parent = "' + this.selectedParent + '"';
    } else {
        query = 'SELECT * FROM ideas WHERE id="' + id + '"';
    }
    var self = this;
    db.all(query, function(err, row) {
        var item = {
            id: 0,
            title: "",
            parent: 0
        };
        if (row.length > 0) item = row[0];
        self.lastSelectedParent = item.parent;
        config.set('lastSelectedParent', self.lastSelectedParent);
        self.selectedParent = item.id;
        config.set('selectedParent', self.selectedParent);
        self.selectedParentTitle = item.title;
        config.set('selectedParentTitle', self.selectedParentTitle);
        self.saveConfig();
        self.list();
    });
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

Idea.prototype.saveConfig = function() {
    config.save(function (err) {
        fs.readFile(__dirname + '/config.json', function (err, data) {
            //console.dir(JSON.parse(data.toString()))
        });
    });
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

        case 'g':
        case 'go':
            this.selectItem(params);
            break;

        case 'b':
        case 'back':
            this.selectPrevious(params);
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
