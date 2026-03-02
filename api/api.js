import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import {appendFileSync} from 'node:fs';
// Use in-memory DB for development/testing
export const database = await open({
  filename: ':memory:',
  driver: sqlite3.Database
});

const createTable = `CREATE TABLE IF NOT EXISTS objects(
  id TEXT PRIMARY KEY COLLATE NOCASE,
  type TEXT COLLATE NOCASE,
  common_role TEXT COLLATE NOCASE,
  common_name TEXT COLLATE NOCASE,
  common_desc TEXT COLLATE NOCASE,
  common_type TEXT COLLATE NOCASE,
  rooms TEXT COLLATE NOCASE,
  functions TEXT COLLATE NOCASE,
  raw TEXT COLLATE NOCASE
) STRICT`;
const insertObject = `INSERT INTO objects (id, type, common_name, common_role, common_desc, common_type, rooms, functions, raw) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
const dropTable = `DROP TABLE IF EXISTS objects`;

function log(msg) {
    appendFileSync('/home/holger/errorlog', msg + '\n');
}

export class ioBrokerApi {
    constructor(options) {
        this.host = options.host || 'http://localhost:8093';
        this.authType = options.authType,
        this.user = options.user,
        this.pass = options.pass,
        this.token = options.token;
        
    }
    async fetch(endpoint,method,params,body){
        //log(`fetching ${method} from ${endpoint} with params ${params} and body ${typeof body}`);
        const url = new URL(endpoint, this.host.endsWith('/') ? this.host : this.host + '/');
        // Append query parameters if provided
        if (params && typeof params === 'object') {
            Object.entries(params).forEach(([key, value]) => {
                url.searchParams.append(key, value);
            });
        }
        if (this.authType === 'query') {
            url.searchParams.append('user', this.user);
            url.searchParams.append('pass', this.pass);
        }
        //console.log(`Fetching ${method} from ${url.toString()}`);
        return await fetch(url.toString(), {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'accept': 'application/json',
            },
            body: (typeof body === "string")? body : JSON.stringify(body)
        })
        .then(response => {
            if (!response.ok) {
                return response.json()
            }
            return response.json();
        });
    }
    async updateDB(){
        await database.run(dropTable);
        await database.run(createTable);
        let addType = async (t) => {
            const res = await this.fetch('/v1/objects', 'GET', { filter: '*', type: t });
            for (const key of Object.keys(res)) {
                const obj = res[key];
                if(!obj.common) obj.common = {};
                const name = (typeof obj.common.name === 'string') ? obj.common.name : (obj.common.name && obj.common.name.en) ? obj.common.name.en : '';
                const role = (typeof obj.common.role === 'string') ? obj.common.role : '';
                const desc = (typeof obj.common.desc === 'string') ? obj.common.desc : (obj.common.desc && obj.common.desc.en) ? obj.common.desc.en : '';
                const type = (typeof obj.common.type === 'string') ? obj.common.type : '';
                const enums = { rooms: [], functions: [] };
                if (JSON.stringify(obj.enums) != "{}") {
                    Object.keys(obj.enums).forEach(enumId => {
                        const e = obj.enums[enumId];
                        enums[enumId.split(".")[1]].push(typeof e == "string" ? e : e.en);
                    });
                }
                delete obj.enums;
                delete obj.from;
                delete obj.user;
                delete obj.ts;
                delete obj.acl;
                delete obj.common.icon;
                await database.run(
                    insertObject,
                    key,
                    obj.type,
                    name,
                    role,
                    desc,
                    type,
                    enums.rooms.join(","),
                    enums.functions.join(","),
                    JSON.stringify(obj)
                );
            }
        };
        const ts = ["device", "channel", "state", "folder", "script", "enum"];
        for (let t of ts) {
            await addType(t);
        }
        return "done";
    }
    async searchDB(sql) {
        try {
            return await database.all(sql);
        } catch (error) {
            return error;
        }
    }
    async getAllRooms() {
        try {
            return await database.all(`select common_name from objects where type='enum' and id like 'enum.rooms.%'`);
        } catch (error) {
            return error;
        }
    }
    async getAllObjectsInRoom(room) {
        try {
            // Use parameterized query to prevent SQL injection
            return await database.all(
                `select * from objects where rooms like ?`,
                [`%${room}%`]
            );
        } catch (error) {
            return error;
        }
    }
    async getAdapters(){
        return (await this.fetch('/v1/command/getAdapters', 'GET')).result.map(adapter => ({
            name:adapter.common.name,
            title:adapter.common.titleLang.en, 
            desc:adapter.common.desc.en,
            keywords:adapter.common.keywords,
            readme:adapter.common.readme,
        }));
    }
    async getRunningInstances(){
        let instances = await this.fetch('/v1/command/getCompactInstances', 'GET');
        return Object.keys(instances.result).map(key => ({
            id:key.replace("system.adapter.",""),
            name: instances.result[key].name,
            enabled: instances.result[key].enabled,
        })).filter(instance => instance.enabled); // Filter only enabled instances */
    }
    async search(args){
        args.type = args.type || "device, channel, state, folder";
        if (!args.searchterm) {
            args.searchterm = ""; // Default to empty string if not provided
        }
        if (!args.limit) {
            args.limit = 100; // Default limit
        }
        if (!args.page) {
            args.page = 0; // Default page
        }
        if (!args.instancePattern) {
            args.instancePattern = "*"; // Default instance pattern
        }
        if (!args.operator) {
            args.operator = "or"; // Default operator
        }
        // Ensure args.type is an object with keys as types
        let results = []
        const types = args.type.split(",").map(type => type.trim());
        for(let i = 0; i < types.length; i++) {
            const data = await this.fetch("/v1/objects",'GET',{filter: args.instancePattern, type:types[i] })
            results.push(searchHelper(data,args))
        }
        return results.flat().slice(args.limit*args.page,args.page*args.limit+args.limit);
    }
    async getState(args) {
        return await this.fetch(`/v1/state/${args.id}`, 'GET', { withInfo: args.withInfo || false });
    }
    async setState(args) {
        return await this.fetch(`/v1/state/${args.id}`, 'GET', { value: args.value });
    }
    async setStateBulk(args) {
        let ret = []
        for (let i = 0; i < args.length; i++) {
            ret.push(await this.fetch(`/v1/state/${args[i].id}`, 'GET', { value: args[i].value }))
        }
        return ret
    }
    async getStatesWithValues(args) {
        return await this.fetch('/v1/states', 'GET', { filter: args.instancePattern || '*' });
    }
    async anotate(args) {
        let body = {"common":{"custom":{"mcp-server.0":{"meta": args.anotation}}}}
        return await this.fetch(`/v1/object/${args.id}`, 'PUT', {}, body);
    }
    async describe(args) {
        let body = {"common":{"desc": args.desc}};
        return await this.fetch(`/v1/object/${args.id}`, 'PUT', {}, body);
    }
    async getObject(args) {
        return await this.fetch(`/v1/object/${args.id}`, 'GET');
    }
    async setObject(args) {
        return await this.fetch(`/v1/object/${args.id}`, 'PUT', {}, args.obj);
    }
    async createState(args) {
        const id = args.id 
        let native = JSON.parse(JSON.stringify(args.native || {})); // Ensure native is an object
        delete args.id; // Remove id from args to avoid conflicts
        delete args.native
        let body = {"type": "state", "common": args, "native": native};
        return await this.fetch(`/v1/object/${id}`, 'POST',{},body);
    }
    async createScene(args) {
// for scenes to work we need a custom script. check if it existst and if not create it
        this.setObject({id:"script.js.mcp_scene_script",obj:{
            "type": "script",
            "common": {
            "name": "mcp_scene_script",
            "expert": true,
            "engineType": "Javascript/js",
            "enabled": true,
            "engine": "system.adapter.javascript.0",
            "source": "on(/^0_userdata.0.mcp_server.scene.*/,data=>{\r\n    if(data.state.val ==true){\r\n        setState(data.id,false,true)\r\n        let obj = getObject(data.id)\r\n        obj.native.members.forEach(m=>{\r\n            setState(m.id,m.value)\r\n        })\r\n    }\r\n})",
            "debug": false,
            "verbose": false
            },
            "native": {}
        }})
        const prefix = "0_userdata.0.mcp_server.scenes."
        const ret = await this.createState({id:prefix + args.name, name: args.name, type: "boolean", role: "button.trigger",native:{members:args.members || []}});
        this.setState({id:prefix + args.name, value: false}); // Initialize the scene state to false
        return ret
    }
    async getRooms() {
       let rooms = await this.fetch('v1/objects','GET',{filter:'enum.rooms.*',type:'enum'})
       rooms = Object.keys(rooms).map(key => {
           return {
               id: key,
               name: (typeof rooms[key].common.name === "string")? rooms[key].common.name : rooms[key].common.name.en,
               desc: rooms[key].common.desc,
               members: rooms[key].common.members,
           };
       })
       return rooms
    }
    async getHistory(args) {
        const defaults = {
            "start": 0,
            "end": 0,
            "count": 0,
            "aggregate": "none",
        } 
        const body = {
            "id": args.id,
            "options": { ...defaults, ...args.options }
        }
       return await this.fetch(`/v1/getHistory`, 'POST',{},body);
    }
}

function searchHelper(data, args) {
  const searchTermArray = args.searchterm ? args.searchterm.toLowerCase().split(",").map(word => word.trim()) : [];
  const operator = args.operator ? args.operator.toLowerCase() : "or"; // Default to "or" if not specified

  return Object.keys(data)
    .map(key => {
      let ret = {
        id: key,
        type: data[key].type,
        common: data[key].common,
        name: data[key].common? data[key].common.name:"",
        desc: data[key].common? data[key].common.desc:"",
        enums: Object.keys(data[key].enums).map(enumId => {
          return { type: enumId.split("."), name: data[key].enums[enumId].en };
        }),
      };
      return ret;
    })
    .map(device => ({
      device: device,
      text: `${device.name} (${device.id}) ${device.desc} ${device.enums.map(e => e.type + ": " + e.name).join(", ")}`,
    }))
    .filter(device => {
      if (!args.searchterm) {
        return true; // If no search term, return all objects
      }

      if (operator === "and") {
        return searchTermArray.every(word => device.text.toLowerCase().includes(word));
      } else {
        return searchTermArray.some(word => device.text.toLowerCase().includes(word)); // Default to "or" for unknown operators
      }
    })
    .map(device => device.device);
}
