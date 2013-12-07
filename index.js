var postfile = './post.txt';
var moment = require('moment');
var uuid = require('node-uuid');
var sys = require('sys');
var exec = require('child_process').exec;
var Showdown = require('showdown');
var github = require('../core/shared/vendor/showdown/extensions/github');
var converter = new Showdown.converter({extensions: [github]});
var markdown, html;
var Attributes= [
	'id', 'uuid', 'title', 'slug', 'markdown', 'html', 'meta_title', 'meta_description',
	'featured', 'image', 'status', 'language', 'author_id', 'created_at', 'created_by', 'updated_at', 'updated_by',
	'published_at', 'published_by'
];
var sanitize = require('validator').sanitize;

var usage = "node index.js <existing_slug> --edit|--submit\nnode index <new_slug>";
main();
//subprocess();

function subprocess () {
	var spawn = require('child_process').spawn('vim');
}

function main() {
	var sqlite3 = require('sqlite3').verbose();
	var db = new sqlite3.Database('../content/data/ghost-dev.db');
	var slug = "";
	var slug_array = {};
	var	fs = require('fs');
	db.serialize(function() {
		db.each("SELECT slug FROM posts",
			function(err, row) {
				slug_array[row.slug] = true;
			},
			function () {
				if (process.argv[2]){
					slug = process.argv[2];
					if (slug_array[slug]) {
						if (process.argv[3] && process.argv[3] == "--edit") {
							var query = "SELECT markdown FROM posts where slug='"+slug+"'";
							db.all(query, function (err, row) {
								if (err) {
									console.log(err);
								} else {
									fs.writeFile(postfile, row[0].markdown, function (err) {
										if (err) {
											console.log(err);
										}
										console.log("You can now edit the file post.txt and then run\nnode index.js "+slug+" --submit");
									});		
									db.close();
								}
							});
						} else if (process.argv[3] && process.argv[3] == "--submit") {
							fs.readFile(postfile, 'utf8', function (err, data) {
								if (err) {
									return sys.puts(err);
								}
								var updated_by = 1;
								var updated_at = moment(new Date()).toDate().getTime();
								markdown = data;
								var html = converter.makeHtml(markdown);
								//console.log(query);
								db.prepare("UPDATE posts set updated_by=1, updated_at=(?), markdown='(?)', html='(?)' where slug='(?)'").run(updated_at, markdown, html, slug, function(err) {}).finalize(function (err){db.close();});
								
							});
						} else {
							console.log("Slug "+slug+" already exists.");
							console.log(usage);
						}
					} else {
						fs.readFile(postfile, 'utf8', function (err,data) {
							sys.puts(moment(new Date()).toDate().getTime());
							if (err) {
								return sys.puts(err);
							}
							sys.puts(uuid.v4());
							markdown = data;
							var html = converter.makeHtml(markdown);
							sys.puts(html);
						});
					}
				} else {
					for (var key in slug_array) {
						console.log(key);
					}
				}
			}
		);
	});
}
