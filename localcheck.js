#!/usr/bin/env node

'use strict';

//
// Check if there are any local Javascript files
// that are not required by any files (and possibly can
// be purged from the repository)
//

var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var Promise = require('es6-promise');
var promisify = require('es6-promisify');
var glob = promisify(require('multi-glob').glob);

var getLocalDependenciesForFiles = require('./dependencies').getLocalDependenciesForFiles;

var configFile = process.argv[2];
if (!configFile || !fs.existsSync(configFile)) {
  console.log('USAGE: node depcheck.js localcheck.json');
  console.log('---------------------------------------\n');

  console.log('Please create a config file similar to the below');
  console.log(JSON.stringify({
    allFiles: './{server/app,client}/**/*.js',
    exclude: './{server,client}/{dist,extension,node_modules,public}/**/*.js',
    ignoreUnused: ['./client/js/baseFile.js', './server/bin/www']
  }, null, 2));
  process.exit(-1);
}

var config = JSON.parse(fs.readFileSync(configFile));

var allFiles = config.allFiles;
var exclude = config.exclude;
var ignoreUnused = config.ignoreUnused;

// 1. Check if there are unreferenced files
var isUnused = {};
Promise.all([
  glob(allFiles, { ignore: exclude }),
  ignoreUnused ? glob(ignoreUnused) : []
]).then(function(result) {
  var files = result[0];
  var ignoreUnusedFiles = result[1];

  files.forEach(function(file) {
    if (ignoreUnusedFiles.indexOf(file) === -1) {
      isUnused[path.resolve(file)] = true;
    }
  });
  return getLocalDependenciesForFiles(files);
}).then(function(usedDependencies) {
  usedDependencies.forEach(function(dep) {
    isUnused[dep] = false;
  });

  console.log('UNUSED FILES');
  console.log('============');

  _.forEach(isUnused, function(unused, file) {
    if (unused) {
      console.log(file);
    }
  });
});
