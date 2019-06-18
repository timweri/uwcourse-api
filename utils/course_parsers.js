/*
This module contains parsers for text that is related to courses like the catalog number
 */

const CATALOG_EXPRESSION = /([A-Z]+)\s?(\d{3}[A-Z]?)/;

exports.CATALOG_EXPRESSION = CATALOG_EXPRESSION;

exports.parse_catalog = (text) => {
    text = text.toUpperCase();
    let match = CATALOG_EXPRESSION.exec(text);
    return {
        subject: match[1],
        catalog_number: match[2],
    };
};
