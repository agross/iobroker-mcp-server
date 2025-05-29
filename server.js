#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {Tools} from './tools/allTools.js';
import { ioBrokerApi } from "./api/api.js"
/* function log(msg){
appendFileSync( '/home/holger/errorlog', msg + '\n')
} */
// Helper to parse CLI args


//fs.appendFile('/home/holger/errorlog', host + '\n' + auth+ '\n');

//registerTools(server, host, auth);
export class IOBrokerMCPServer{
    constructor(options){
        this.options = options
        this.API = new ioBrokerApi(options);
        this.server = new McpServer({
            name: "iobroker-mcp-server",
            version: "1.0.0",
            capabilities: {
                logging: {},
                resources: {},
                tools: {}
            },
        });
        this.transport = new StdioServerTransport();
        this.Tools = Tools
    }

    async start() {
        await this.API.updateDB()
        for (const toolName in this.Tools) {
            const tool = this.Tools[toolName];
            this.server.tool(tool.name, tool.desc, tool.params, tool.call(this.API));
        }
        await this.server.connect(this.transport); 
    }

}

