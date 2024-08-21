// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }

const { lexer, tokenStart, tokenEnd, convertToken, convertTokenId } = require("./lexer.js");

function toNumber(d) {
    return parseFloat(d[0]);
}
var grammar = {
    Lexer: lexer,
    ParserRules: [
    {"name": "main", "symbols": ["_ml", "top_level_definitions", "_ml"]},
    {"name": "top_level_definitions", "symbols": ["top_level_definition", "_ml", "top_level_definitions"], "postprocess": 
        d => [d[0], ...d[2]]
                },
    {"name": "top_level_definitions", "symbols": ["top_level_definition"], "postprocess": 
        d => [d[0]]
                },
    {"name": "top_level_definition", "symbols": ["function_def"], "postprocess": id},
    {"name": "top_level_definition", "symbols": ["event_def"], "postprocess": id},
    {"name": "top_level_definition", "symbols": ["executable_statements"]},
    {"name": "function_def", "symbols": [{"literal":"fn"}, "_", "identifier", "_", {"literal":"("}, "_", "parameter_list", "_", {"literal":")"}, "_", "code_block"], "postprocess": 
        d => ({
            type: "function_def",
            name: d[2],
            parameters: d[6],
            body: d[10],
            start: tokenStart(d[0]),
            end: d[10].end
        })
                },
    {"name": "event_def", "symbols": [{"literal":"on"}, "_", "identifier", "_", {"literal":"("}, "_", "parameter_list", "_", {"literal":")"}, "_", "code_block"], "postprocess": 
        d => ({
            type: "event_def",
            name: d[2],
            parameters: d[6],
            body: d[10],
            start: tokenStart(d[0]),
            end: d[10].end
        })
                },
    {"name": "parameter_list", "symbols": [], "postprocess": () => []},
    {"name": "parameter_list", "symbols": ["identifier"], "postprocess": d => [d[0]]},
    {"name": "parameter_list", "symbols": ["identifier", "_", {"literal":","}, "_", "parameter_list"], "postprocess": 
        d => [d[0], ...d[4]]
                },
    {"name": "code_block", "symbols": [{"literal":"{"}, "_ml", "executable_statements", "_ml", {"literal":"}"}], "postprocess": 
        (d) => ({
            type: "code_block",
            statements: d[2],
            start: tokenStart(d[0]),
            end: tokenEnd(d[4])
        })
            },
    {"name": "executable_statements", "symbols": ["executable_statement", "_ml", "executable_statements"], "postprocess": d => [d[0], ...d[2]]},
    {"name": "executable_statements", "symbols": ["executable_statement"], "postprocess": d => [d[0]]},
    {"name": "executable_statement", "symbols": ["return_statement"], "postprocess": id},
    {"name": "executable_statement", "symbols": ["var_assignment"], "postprocess": id},
    {"name": "executable_statement", "symbols": ["line_comment"], "postprocess": id},
    {"name": "return_statement", "symbols": [{"literal":"return"}, "__", "expression"], "postprocess": 
        d => ({
            type: "return_statement",
            value: d[2],
            start: tokenStart(d[0]),
            end: d[2].end
        })
               },
    {"name": "var_assignment", "symbols": ["perm_assignment"]},
    {"name": "var_assignment", "symbols": ["temp_assignment"]},
    {"name": "perm_assignment", "symbols": [{"literal":"perm"}, "_", "identifier", "_", {"literal":"="}, "_", "expression"], "postprocess": 
        d => ({
            type: "perm_assignment",
            var_name: d[0],
            value: d[4],
            start: d[0].start,
            end: d[4].end
        })
                },
    {"name": "temp_assignment", "symbols": [{"literal":"temp"}, "_", "identifier", "_", {"literal":"="}, "_", "expression"], "postprocess": 
        d => ({
            type: "temp_assignment",
            var_name: d[0],
            value: d[4],
            start: d[0].start,
            end: d[4].end
        })
                },
    {"name": "expression", "symbols": ["boolean_expression"], "postprocess": id},
    {"name": "boolean_expression", "symbols": ["comparison_expression"], "postprocess": id},
    {"name": "boolean_expression", "symbols": ["comparison_expression", "_", "boolean_operator", "_", "boolean_expression"], "postprocess": 
        d => ({
            type: "binary_operation",
            operator: convertToken(d[2]),
            left: d[0],
            right: d[4],
            start: d[0].start,
            end: d[4].end
        })
                },
    {"name": "boolean_operator", "symbols": [{"literal":"&&"}], "postprocess": id},
    {"name": "boolean_operator", "symbols": [{"literal":"||"}], "postprocess": id},
    {"name": "comparison_expression", "symbols": ["additive_expression"], "postprocess": id},
    {"name": "comparison_expression", "symbols": ["additive_expression", "_", "comparison_operator", "_", "comparison_expression"], "postprocess": 
        d => ({
            type: "binary_operation",
            operator: d[2],
            left: d[0],
            right: d[4],
            start: d[0].start,
            end: d[4].end
        })
                },
    {"name": "comparison_operator", "symbols": [{"literal":">"}], "postprocess": convertTokenId},
    {"name": "comparison_operator", "symbols": [{"literal":">="}], "postprocess": convertTokenId},
    {"name": "comparison_operator", "symbols": [{"literal":"<"}], "postprocess": convertTokenId},
    {"name": "comparison_operator", "symbols": [{"literal":"<="}], "postprocess": convertTokenId},
    {"name": "comparison_operator", "symbols": [{"literal":"=="}], "postprocess": convertTokenId},
    {"name": "additive_expression", "symbols": ["multiplicative_expression"], "postprocess": id},
    {"name": "additive_expression", "symbols": ["multiplicative_expression", "_", /[+-]/, "_", "additive_expression"], "postprocess": 
        d => ({
            type: "binary_operation",
            operator: convertToken(d[2]),
            left: d[0],
            right: d[4],
            start: d[0].start,
            end: d[4].end
        })
                },
    {"name": "multiplicative_expression", "symbols": ["unary_expression"], "postprocess": id},
    {"name": "multiplicative_expression", "symbols": ["unary_expression", "_", /[*/%]/, "_", "multiplicative_expression"], "postprocess": 
        d => ({
            type: "binary_operation",
            operator: convertToken(d[2]),
            left: d[0],
            right: d[4],
            start: d[0].start,
            end: d[4].end
        })
                },
    {"name": "unary_expression", "symbols": ["number"], "postprocess": id},
    {"name": "unary_expression", "symbols": ["identifier"], "postprocess": 
        d => ({
            type: "var_reference",
            var_name: d[0],
            start: d[0].start,
            end: d[0].end
        })
                },
    {"name": "unary_expression", "symbols": ["string_literal"], "postprocess": id},
    {"name": "unary_expression", "symbols": ["boolean_literal"], "postprocess": id},
    {"name": "unary_expression", "symbols": ["boolean_literal"], "postprocess": id},
    {"name": "unary_expression", "symbols": [{"literal":"("}, "expression", {"literal":")"}], "postprocess": 
        data => data[1]
                },
    {"name": "boolean_literal", "symbols": [{"literal":"true"}], "postprocess": 
        d => ({
            type: "boolean_literal",
            value: true,
            start: tokenStart(d[0]),
            end: tokenEnd(d[0])
        })
                },
    {"name": "boolean_literal", "symbols": [{"literal":"false"}], "postprocess": 
        d => ({
            type: "boolean_literal",
            value: false,
            start: tokenStart(d[0]),
            end: tokenEnd(d[0])
        })
                },
    {"name": "__$ebnf$1", "symbols": [(lexer.has("ws") ? {type: "ws"} : ws)]},
    {"name": "__$ebnf$1", "symbols": ["__$ebnf$1", (lexer.has("ws") ? {type: "ws"} : ws)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "__", "symbols": ["__$ebnf$1"]},
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1", "symbols": ["_$ebnf$1", (lexer.has("ws") ? {type: "ws"} : ws)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "_", "symbols": ["_$ebnf$1"]},
    {"name": "_ml$ebnf$1", "symbols": []},
    {"name": "_ml$ebnf$1", "symbols": ["_ml$ebnf$1", "multi_line_ws_char"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "_ml", "symbols": ["_ml$ebnf$1"]},
    {"name": "multi_line_ws_char", "symbols": [(lexer.has("ws") ? {type: "ws"} : ws)]},
    {"name": "multi_line_ws_char", "symbols": [(lexer.has("nl") ? {type: "nl"} : nl)]},
    {"name": "line_comment", "symbols": [(lexer.has("comment") ? {type: "comment"} : comment)], "postprocess": convertTokenId},
    {"name": "string_literal", "symbols": [(lexer.has("string_literal") ? {type: "string_literal"} : string_literal)], "postprocess": convertTokenId},
    {"name": "number", "symbols": [(lexer.has("number_literal") ? {type: "number_literal"} : number_literal)], "postprocess": convertTokenId},
    {"name": "identifier", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": convertTokenId}
]
  , ParserStart: "main"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
