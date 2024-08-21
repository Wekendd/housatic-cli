const fs = require("fs");

const nearley = require("nearley");
const grammar = require("./grammar.js");
const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

parser.feed(fs.readFileSync("./test/test.fp", "utf8"));

console.log(JSON.stringify(parser.results));
