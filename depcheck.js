'use strict';

var Promise = require('es6-promise').Promise;
var _ = require('lodash');
var promisify = require('es6-promisify');
var glob = promisify(require('multi-glob').glob);
var fs = require('fs');
var path = require('path');
var builtIn = require('builtin-modules');

var dependencies = require('./dependencies');
var getDependenciesForFiles = dependencies.getDependenciesForFiles;
var getFullDependenciesForFiles = dependencies.getFullDependenciesForFiles;

var builtInKeyed = _.zipObject(builtIn, builtIn);

var configFile = process.argv[2];
if (!configFile || !fs.existsSync(configFile)) {
  console.log('USAGE: node depcheck.js depcheck-config.json');
  console.log('--------------------------------------------\n');
  console.log('Please create a depcheck-config.json similar to the below');
  console.log(JSON.stringify({
    files: './glob/to/files/**/*.{scss,js}',
    excludeFiles: './glob/to/files/to_exclude/**/*',
    ignorePackages: ['babel-core'],
    filesToCheck: ['./package.json', '../vendorPackages.json']
  }, null, 2));
  console.log('== OR (for filesToCheck) ==');
  console.log(JSON.stringify({
    filesToCheck: {
      './package.json': 'packages',
      '../vendorPackages.json': 'fullPath'
    }
  }, null, 2));
  console.log('`fullPath` checks that the full path of the require');
  console.log('is present in the file (e.g., "react-bootstrap/lib/Test")');
  console.log('`packages` checks only the package (e.g., "react-bootstrap")');
  process.exit(-1);
}

var config = JSON.parse(fs.readFileSync(configFile, { encoding: 'utf8' }));
var filesToCheck = config.filesToCheck;
if (config.filesToCheck instanceof Array) {
  filesToCheck = {};
  config.filesToCheck.forEach(function(file) {
    filesToCheck[file] = 'packages';
  });
}

var ignorePackages = config.ignorePackages || [];
var ignoreKeyed = _.zipObject(ignorePackages, ignorePackages);

var options = config.excludeFiles ? { ignore: config.excludeFiles } : {};

glob(config.files, options).then(function(files) {
  return Promise.all([
    getDependenciesForFiles(files),
    getFullDependenciesForFiles(files)
  ]);
}).then(function(results) {
  var used = results[0];
  var fullUsed = results[1];
  var usedKeyed = _.zipObject(used, used);
  var fullUsedKeyed = _.zipObject(fullUsed, fullUsed);

  _.forEach(filesToCheck, function(checkType, packagesFile) {
    console.log('Unused dependencies in ' + packagesFile);
    console.log('========================================');

    var packagesFileContents = JSON.parse(fs.readFileSync(packagesFile, { encoding: 'utf8' }));
    var dependencies = [];
    if (path.basename(packagesFile) === 'package.json') {
      // For package.json, use dependencies and devDependencies
      dependencies = _.keys(packagesFileContents.dependencies)
          .concat(_.keys(packagesFileContents.devDependencies));
    } else {
      // For other files, it's a single array
      dependencies = packagesFileContents;
    }

    var used = checkType === 'packages' ? usedKeyed : fullUsedKeyed;

    var depKeyed = _.zipObject(dependencies, dependencies);
    dependencies.forEach(function(dep) {
      if (!used[dep] && !ignoreKeyed[dep]) {
        console.log(dep);
      }
    });

    console.log('Missing dependencies in ' + packagesFile);
    console.log('========================================');
    _.forEach(used, function(blah, dep) {
      if (!depKeyed[dep] && !ignoreKeyed[dep] && !builtInKeyed[dep]) {
        console.log(dep);
      }
    });
  });
});

