#!/usr/bin/env node
'use strict';

const fs = require('fs');

const i18n = {},
      inpath = '../admin-ui/src/main/resources/public/org/opencastproject/adminui/languages',
      outpath = './src/i18n';

fs.mkdir("src/i18n", { recursive: true}, (err) => {
  if (err) {
    throw err;
  }
});

fs.readdirSync(inpath).filter(file => file.endsWith(".json")).forEach(file => {
  fs.copyFile(inpath + "/" + file, outpath + "/" + file, (err) => {
    if (err) {
      throw err;
    }
  });
});

console.log("Copied i18n files from Admin UI.");
