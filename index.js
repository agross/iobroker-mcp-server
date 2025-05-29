#!/usr/bin/env node
import { ioBrokerApi } from "./api/api.js"
import {Tools} from './tools/allTools.js';
import { IOBrokerMCPServer } from "./server.js";


function parseArgs(argv) {
  const args = {};
  argv.forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, ...rest] = arg.slice(2).split('=');
      if (rest.length > 0) {
        args[key] = rest.join('='); // Handles values with '=' in them
      } else {
        args[key] = true; // Flag with no value, e.g. --help
      }
    }
  });
  return args;
}

const cliArgs = parseArgs(process.argv.slice(2));

// Read auth info from env or CLI args
const authType = cliArgs.authType || process.env.IOB_AUTH_TYPE; // "query", "basic", or "bearer"
const user = cliArgs.user || process.env.IOB_USER;
const pass = cliArgs.pass || process.env.IOB_PASS;
const token = cliArgs.token || process.env.IOB_TOKEN;

let auth;
if (authType === "bearer" && token) {
  auth = { type: "bearer", token };
} else if ((authType === "basic" || authType === "query") && user && pass) {
  auth = { type: authType, user, pass };
} else {
  auth = undefined; // No auth
}

if (cliArgs.test) {
    console.log("test")
    const API = new ioBrokerApi({
        host: cliArgs.host || process.env.IOB_HOST || "http://192.168.178.38:8093",
        ...auth
    });
    //console.log(await Tools.getRunningInstances.call(API)());
    await API.updateDB();
    console.log(await API.getHistory({
  "id": "javascript.0.stromzäler.out",
  "options": {
    "start": 1745921229000,
    "end": 1748513229000,
    "count": 5,
    "aggregate": "max"
  }
}));
} else {
    let server = new IOBrokerMCPServer({
        host: cliArgs.host || process.env.IOB_HOST || "http://192.168.178.38:8093",
        ...auth
    })
    server.start()
}
