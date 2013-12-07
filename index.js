var postfile = './post.txt';
var moment = require('moment');
var uuid = require('node-uuid');
var sys = require('sys');
var exec = require('child_process').exec;
var Showdown = require('showdown');
var github = require('../core/shared/vendor/showdown/extensions/github');
var converter = new Showdown.converter({extensions: [github]});
var	fs = require('fs');
var markdown, html;
var Attributes= [
	'id', 'uuid', 'title', 'slug', 'markdown', 'html', 'meta_title', 'meta_description',
	'featured', 'image', 'status', 'language', 'author_id', 'created_at', 'created_by', 'updated_at', 'updated_by',
	'published_at', 'published_by'
];

main();

function main() {
	var sqlite3 = require('sqlite3').verbose();
	var db = new sqlite3.Database('../content/data/ghost-dev.db');
	var slug = "";
	var slug_array = {};
	db.serialize(function() {
		db.each("SELECT slug FROM posts",
			function(err, row) {
				slug_array[row.slug] = true;
			},
			function () {
				if (process.argv[2]){
					slug = process.argv[2];
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
				} else {
					console.log(slug_array);
				}
			}
		);
		db.close();
	});
}
