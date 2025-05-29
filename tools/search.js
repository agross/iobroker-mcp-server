import {z} from "zod";
const DESC = `this search tool helps you discover devices, channels, states amd folders.
    You can search for a specific term and filter by type. allowed types are 'device', 'channel', 'state' and 'folder' and 'script'.
    You can also specify an instance pattern to match the instance name (exqple: hue.0.* or zigbee.1.* or zigbee.*.group* or *.*.brighness) "*" can appear anywhere in patterns exept at the beginning. (this will not work: *.brightness) 
    The search supports multiple terms separated by commas, and you can choose between 'or' and 'and' operators for the search terms.
    you can limit the number of results and specify the page number to paginate through the results.
    The default limit is 100 and the default page is 0.
    If you want to search for a specific type of object, you can use the type parameter to specify the type(s) you want to search for.
    If you want to search for a specific instance, you can use the instancePattern parameter to specify the instance pattern you want to search for.
    If you want to search for a specific term, you can use the searchterm parameter to specify the term you want to search for.
    If you want to change the operator used for the search, you can use the operator parameter to specify the operator you want to use. The default operator is 'or'.
    If you want to search for all objects, you can leave the searchterm parameter empty or not provide it at all.
    `
export const search = {
    name:"search",
    desc: DESC,
    params: {
        searchterm: z.string().optional().describe("The term to search for in the objects. you can pass multiple term seperated by commas. by default the operator is 'or' you can change it to 'and' using the operator parameter"),
        type: z.string().optional().default("device, channel, state, folder, script").describe("The type of objects to search for, valid values are 'device', 'channel', 'state' and 'folder' and 'script'. You can pass multiple types separated by commas. Default is all types."),
        instancePattern: z.string().optional().default("*").describe("The pattern to match the instance name. Default is '*' which matches all instances."),
        limit: z.number().optional().default(100).describe("The maximum number of results to return. Default is 100."),
        page: z.number().optional().default(0).describe("The page number to return. Default is 0."),
        operator: z.enum(["or", "and"]).optional().default("or").describe("The operator to use for the search. Default is 'or'. If 'and' is used, all search terms must match."),
    },
    call: API => async (args) => {
        let instances = await API.search(args)
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(instances),
                },
            ],
        };
    },
}