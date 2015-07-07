#!/usr/bin/env node
/* global Buffer */

"use strict";

var cli = require('cli');
cli.parse({
    format: ['f', 'Output file format, currently supports [c]', 'string', 'c'],
    output: ['o', 'Output file path', 'file']
});

cli.setApp('./package.json');
var fs = cli.native.fs;

function dataArrayHeader() {
    return 'uint8_t data[] = {\n';
}

function dataArrayTail() {
    return '\n};';
}

function convertBinaryToChar(buff, length) {
    var i, str = '';
    var step = 8;
    for (i = 0; i < length; ++i) {
        if (step == 8) {
            str += '\t';
        }
        str += "0x" + buff.toString('hex', i, i + 1) + ", ";
        step--;
        if (step == 0) {
            str += '\n';
            step = 8;
        }
    }
    return str;
}

function getFilesizeInBytes(fd) {
    return fs.fstatSync(fd)["size"];
}

function convertFile(input, output, format) {
    if (fs.existsSync(output)) {
        throw new Error(output + " already exists.");
    }

    var input_fd = fs.openSync(input, 'r');
    var input_size = getFilesizeInBytes(input_fd);

    var buff = new Buffer(256), totalBytesRead = 0;
    fs.appendFileSync(output, dataArrayHeader());
    while (input_size > totalBytesRead) {
        var bytesRead = fs.readSync(input_fd, buff, 0, 256, totalBytesRead);
        totalBytesRead += bytesRead;
        fs.appendFileSync(output, convertBinaryToChar(buff, bytesRead));
    }
    fs.appendFileSync(output, dataArrayTail());
}

cli.main(function(args, options) {
    var input;

    if (this.argc) {
        input = args[0];
    } else {
        cli.getUsage(1);
    }

    if (options.format != 'c') {
        cli.getUsage(1);
    }

    if (!options.output) {
        cli.getUsage(1);
    }

    cli.spinner('Converting...');
    convertFile(input, options.output, options.format);
    cli.spinner('Converting... done!', true);
});
