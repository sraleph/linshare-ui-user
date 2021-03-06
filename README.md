# linshare-ui-user

This project is a restFull user interface angular app for Linshare-core project

## Setup

Some dependencies are required:

> From the web
  - [RubyGems](https://rubygems.org/pages/download/)
  - [Nodejs](https://nodejs.org/en/download/) which include [Npm](https://www.npmjs.com/get-npm?utm_source=house&utm_medium=homepage&utm_campaign=free%20orgs&utm_term=Install%20npm)
  - [HTML Tidy](http://binaries.html-tidy.org/)
  - [Hunspell](https://github.com/hunspell/hunspell)
> From Npm
  - [Jshint](http://jshint.com/install/)
> From Gem
  - [Ruby-compass](http://compass-style.org/install/)
  - [Overcommit](https://github.com/brigade/overcommit#installation)
  - [Scss_lint](https://github.com/brigade/scss-lint#installation)


Most of the dependencies are also available by your OS packet manager

  For Ubuntu:
  ```bash
  sudo apt-get install nodejs nodejs-legacy npm ruby-compaas tidy hunspell
  npm install jshint
  gem install overcommit scss_lint

  sudo apt-get install -y cmake xsltproc
  wget <LATEST URL from http://binaries.html-tidy.org, linux 64-bit DEB>
  sudo apt-get -y autoremove tidy
  sudo dpkg -i tidy-*.*.*-64bit.deb
  rm tidy-*.deb
  ```

## Cloning the repository

```bash
# For a full clone with submodule
git clone --recursive

# Or after simple clone, to get sumbodule
git submodule update --init

# Activate git hook with overcommit
cd <path to repo>
overcommit
```

## Build & development

```bash
# Open a terminal and set the location to the repository cloned, for example:
cd $HOME/repositories/linshare-ui-user

# Download the node modules
npm install

# Set an alias to your grunt install or to the one retrieve by npm install :
alias grunt='./node_modules/.bin/grunt'

# You can also add the previous line to your .bashrc, to avoid settign it everytime

```

Run `grunt` for building and `grunt serve` for preview.

## Testing

Running `grunt test` will run the unit tests with karma.

## Modules Architecture

```
linshare.document/
├── controller.js
├── directives
│   ├── directive1.js
│   └── directive2.js
├── service.js
└── views
    ├── detail.html
    └── list.html
```

## change current version
mvn versions:set -DnewVersion=0.1.0-SNAPSHOT && mvn validate -Pupdate-version

git commit

## Packaging
mvn package

## Deploy snapshot
mvn deploy

## release
mvn -Dresume=false release:prepare release:perform

## Hard clean
mvn -Phard-clean

## Pitfall
A list of encountered pitfall is registered [here](README.PITFALL.md)

