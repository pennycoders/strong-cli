// example - create an example project
//
// Projects are cloned from github. A mechanism that did not depend on the
// existence of git on the developer's machine would be preferable, such as the
// template-based approach used by `slc create`.

module.exports = example;

var colors = require('colors'); // XXX(sam) don't need to assign to colors
var debug = require('debug')('slc');
var fs = require('fs.extra');
var install = require('./install');
var path = require('path');

// fs.extra won't copy the symlinks in node_modules/.bin, ncp does :-(
fs.copyRecursive = require('cpr');

function example(argv, options, loader, type, repo, name) {
  // Fail on existing paths
  try {
    fs.lstatSync(name);
    return loader.error('Cannot create example at %s: Path exists', name);
  } catch (err) {
    // Expected that name does not exist
  }

  // Create target path, in case intermediate directories need to be made (ncp
  // doesn't handle that).
  try {
    fs.mkdirRecursiveSync(name);
  } catch (err) {
    return loader.error('Cannot create example at %s: %s', name, err);
  }

  console.log('Creating %s example in %s', type, name);

  var srcDir = path.resolve(__dirname, '..', 'data', repo);

  debug('copy %s to %s', srcDir, name);

  fs.copyRecursive(srcDir, name, function(errs) {
    if (errs && errs.length) {
      // err is not an Error, in violation of all things node, its an array of
      // Error, take the first
      // err = err.shift();
      return loader.error('Failed to create example at %s: %s', name, errs);
    }

    // Its faster and more robust to copy everything, and delete what we don't
    // want. Particularly because the semantics of various recursive copy
    // implementations I tried were bizarre with the various combinations of
    // src/dst files and directories.
    if (options.install !== false) {
      process.chdir(name);
      install(function(err) {
        if (err) {
          return loader.error(err);
        }
        return prompt();
      });
    } else {
      return prompt();
    }
  });

  function prompt() {
    console.log();
    console.log('Run the example:');
    console.log('  $ cd', name.green);
    if (options.install === false) {
      console.log('  $ npm install');
    }
    console.log('  $ slc strongops # ' +
               'Optional: To view your app in the StrongOps dashboard'.yellow);
    console.log('  $ slc run');
  }
}
