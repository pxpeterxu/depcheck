'use strict';

var Promise = require('es6-promise').Promise;
var promisify = require('es6-promisify');
var fs = require('fs');
var _ = require('lodash');
var path = require('path');
var resolve = require('resolve');

var readFile = promisify(fs.readFile);

/**
 * Get the dependencies (npm-installed) for a file
 * @param {String} file     name of file to get dependencies for
 * @param {Object} patterns patterns for es6, requireJs, and css
 * @param {boolean} shouldResolve whether to resolve matches to absolute paths
 * @return Promise.<array of dependencies>
 */
function getDependencies(file, patterns, shouldResolve) {
  patterns = patterns || {};

  var es6Pattern = patterns.es6 === undefined ?
    /import [^;]* from ["']([^.][^"'/]+)/g : patterns.es6;
  var requireJsPattern = patterns.requireJs === undefined ?
    /require\(["']([^.][^"'/]+)/g : patterns.requireJs;
  var cssPattern = patterns.css === undefined ?
    /@import ["'][^"']*\/node_modules\/([^/]+)/g : patterns.css;

  var dir = path.dirname(file);

  return readFile(file).then(function(contents) {
    var dependencies = [];

    [es6Pattern, requireJsPattern, cssPattern].forEach(function(pattern) {
      if (!pattern) return;

      var match;
      while ((match = pattern.exec(contents))) {
        try {
          var dependency = shouldResolve ?
            resolve.sync(match[1], { basedir: dir }) : match[1];
          dependencies.push(dependency);
        } catch (err) {
          console.error('Could not resolve ' + match[1] + ' in ' + dir);
        }
      }
    });

    return dependencies;
  });
}

/**
 * Gets the dependencies for all the files in the list
 * @param {Array} files  array of file names
 * @param {Object} patterns patterns for es6, requireJs, and css
 * @param {boolean} resolve whether to resolve matches to absolute paths
 * @return Promise.<unique array of dependencies>
 */
function getDependenciesForFiles(files, patterns, resolve) {
  return Promise.all(files.map(function(file) {
    return getDependencies(file, patterns, resolve);
  })).then(function(fileDependencies) {
    var allDependencies = {};
    fileDependencies.forEach(function(dependencies) {
      dependencies.forEach(function(dep) {
        allDependencies[dep] = true;
      });
    });

    return _.keys(allDependencies);
  });
}

var localDependencyPatterns = {
  es6: /import [^;]* from '(\.[^']+)'/g,
  requireJs: /require\('(\.[^']+)'/g,
  css: null
};

/**
 * Gets the locally-referenced files in existing files (e.g.,
 * require('./Blah'), require('../Blah2')
 * @param {Array} files  array of file names
 * @return {Promise.<Array>} unique array of dependencies
 */
function getLocalDependenciesForFiles(files) {
  return getDependenciesForFiles(files, localDependencyPatterns, true);
}

var fullDependencyPatterns = {
  es6: /import [^;]* from ["']([^.][^"']+)/g,
  requireJs: /require\(["']([^.][^"']+)/g,
  css: null
};


/**
 * Gets the full dependencies for package dependencies, including
 * those with 'react-bootstrap/lib/Tooltip' (gets that instead of
 * just 'react-bootstrap'
 * @param {Array} files  array of file names
 * @return {Promise.<Array>} unique array of dependencies
 */
function getFullDependenciesForFiles(files) {
  return getDependenciesForFiles(files, fullDependencyPatterns);
}

module.exports = {
  getDependenciesForFiles: getDependenciesForFiles,
  getLocalDependenciesForFiles: getLocalDependenciesForFiles,
  getFullDependenciesForFiles: getFullDependenciesForFiles,
  getDependencies: getDependencies
};
