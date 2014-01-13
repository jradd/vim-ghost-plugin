var Attributes= [
	'id', 'uuid', 'title', 'slug', 'markdown', 'html', 'meta_title', 'meta_description',
	'featured', 'image', 'status', 'language', 'author_id', 'created_at', 'created_by', 'updated_at', 'updated_by',
	'published_at', 'published_by'
];
var usage = [
	"\nTo list the existing posts:\n\tnode index.js\n",
	"\nTo edit an existing post:\n\tnode index.js <existing_slug>\n",
	"\nTo create a new post:\n\tnode index.js <new_slug> --title <title> [--file <file>]\n",
	"\nTo view markdown rules:\n\tcat markdown-guide.md\n"
];
main();

function main() {
	var postfile = '/tmp/post.txt';
	var moment = require('moment');
	var Showdown = require('showdown');
	var github = require('../core/shared/vendor/showdown/extensions/github');
	var converter = new Showdown.converter({extensions: [github]});
	var sqlite3 = require('sqlite3').verbose();
	var uuid = require('node-uuid');
	var db = new sqlite3.Database('../content/data/ghost-dev.db');
	var slug = "";
	var slug_array = {};
	var	fs = require('fs');
	var markdown, html;
	var note_str = "<!-- Use :cq if you don't want to publish it. Remove this line before publishing. -->\n";
	db.serialize(function() {
		db.each("SELECT title,slug FROM posts",
			function(err, row) {
				slug_array[row.slug] = row.title;
			},
			function () {
				if (process.argv[2]) {
					if (process.argv[2] == "-h" || process.argv[2] == "--help") {
						console.log(usage[0]+usage[1]+usage[2]+usage[3]);
						return;
					} else if (process.argv[2] == "-l" || process.argv[2] == "--list") {
						show_existing_slugs();
						return;
					}
					slug = process.argv[2];
					if (/\s/.test(slug) || /[A-Z]/.test(slug)) {
						console.log("Slug cannot have white spaces or uppercase letters.");
						return;
					}
					if (slug_array[slug]) {
						copy_post_to_file();
					} else {
						if (process.argv[3] && process.argv[3] == "--title" && process.argv[4]) {
							create_empty_post();
						} else {
							console.log("New post requires a title");
							console.log(usage[2]);
						}
					}
				} else {
					console.log(usage[0]+usage[1]+usage[2]+usage[3]);
					return;
				}
			}
		);
	});
	function show_existing_slugs() {
		for (var key in slug_array) {
			console.log(key);
			//console.log(key+" , "+slug_array[key]);
			//console.log("\n\tslug => "+key + "\ttitle => "+slug_array[key]);
		}
		console.log(" ");
	}
	function copy_post_to_file() {
		var query = "SELECT markdown FROM posts where slug='"+slug+"'";
		db.all(query, function (err, row) {
			if (err) {
				console.log(err);
				return;
			} else {
				str = note_str+row[0].markdown;
				fs.writeFile(postfile, str, function (err) {
					if (err) {
						console.log(err);
						return;
					}
					var editor = require('editor');
					editor(postfile, function (code, sig) {
						console.log('Code ' + code+' Signal '+sig);
						if (code === 0 && typeof signal === 'undefined') {
							submit_editted_post();
							console.log('Editted');
						}
					});
				});		
			}
		});
	}

	function create_empty_post() {
		var str = note_str;
		fs.writeFile(postfile, str, function (err) {
			if (err) {
				console.log(err);
				return;
			}
			var editor = require('editor');
			editor(postfile, function (code, sig) {
				console.log('Code ' + code+' Signal '+sig);
				if (code === 0 && typeof signal === 'undefined') {
					console.log('Submitted');
					submit_new_post();
				}
			});
		});		
	}

	function submit_editted_post() {
		fs.readFile(postfile, 'utf8', function (err, data) {
			if (err) {
				console.log(err);
				return;
			}
			var updated_by = 1;
			var updated_at = moment(new Date()).toDate().getTime();
			markdown = data;
			var html = converter.makeHtml(markdown);
			//console.log(query);
			db.prepare("UPDATE posts set updated_by=1, updated_at=(?), markdown=(?), html=(?) where slug=(?)")
			.run(updated_at, markdown, html, slug, function(err) {
				if(err) {
					console.log(err);
					return;
				}
			})
			.finalize(function (err) {
				if(err) {
					console.log(err);
					return;
				}
				db.close();
			});
		});
	}

	function submit_new_post() {
		var title = process.argv[4];
		var uid = uuid.v4();
		fs.readFile(postfile, 'utf8', function (err,data) {
			if (err) {
				console.log(err);
				return;
			}
			var created_by = 1;
			var created_at = moment(new Date()).toDate().getTime();
			markdown = data;
			var html = converter.makeHtml(markdown);
			db.prepare("INSERT INTO posts (uuid, created_at, created_by, published_by, published_at, language, author_id, status, slug, title, markdown, html) VALUES((?), (?), 1, 1, (?), (?), 1, (?), (?), (?), (?), (?))")
			.run(uid, created_at, created_at, "en_US", "published", slug, title, markdown, html, function(err) {
				if(err) {
					console.log(err);
					return;
				}
			})
			.finalize(function (err) {
				if(err) {
					console.log(err);
					return;
				}
				db.close();
			});
		});
	}
}
