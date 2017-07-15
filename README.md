# Depcheck
`depcheck` looks through the files in your project to either:
* With `depcheck`: find packages that are listed in `package.json` that are no
  longer used
* With `localcheck`: find files that are not referenced by any other Javascript
  file (e.g., orphaned in a refactor)

## Usage
To use depcheck or localcheck, you need to create a `depcheck.json` file, which
has the following format:

* `files`: array of globs whose require/import statements you want to check

* `filesToCheck`: the `package.json` or other files you'd like to check.
  This can either be an array of files, or a hash in the format of:
  ```json
  {
    "vendorPackages.json": "fullPath",
    "packages.json": "packages",
  }
  ```
  `packages` means we want to make sure the package itself is defined (e.g.,
  `react-bootstrap`), while `fullPath` means we want the full required string
  to be present (`react-bootstrap/lib/Modal`).

  For files named `package.json`, it'll look in `dependencies` and
  `devDependencies`. For all other files, it will assume the file is an array
  of packages, and just look in the top-level array.

* `ignorePackages` is a list of packages that you'd like to be ignored even if
  it seems like they're unused. These are most often used for linters, Babel
  transforms, and other implicit dependencies.

Once you have a `depcheck.json`, simply run it using:

`depcheck depcheck.json`

## Sample depcheck.json
```json
{
  "files": [
    "{gulpfile.js,build/**/*.js}",
    "client/{assets,js,templates}/**/*.{scss,js,coffee}",
    "server/{{app,scripts}/**/*.js,app.js}",
    "test/**/*.js"
  ],
  "filesToCheck": ["package.json"],
  "ignorePackages": [
    "babel-core",
    "babel-eslint",
    "babel-loader",
    "babel-preset-react",
    "babel-preset-es2015",
    "babel-plugin-transform-class-properties",
    "bluebird",
    "eslint",
    "eslint-config-airbnb",
    "eslint-config-airbnb-base",
    "eslint-plugin-flowtype",
    "eslint-plugin-import",
    "eslint-plugin-jsx-a11y",
    "eslint-plugin-react",
    "flow-bin",
    "json-loader",
    "minifyify",
    "history",
    "mysql",
    "mocha"
  ]
}
```
