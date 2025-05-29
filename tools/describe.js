import {z} from "zod";
const DESC = `the describe tool allows you to set a description for an object in the ioBroker system.
    The description will be stored in the common.desc field of the object and can be used for search purposes.
    This is useful to provide additional information about the object that is not covered by the standard fields.
    The description can be set for devices, channels, states, and folders.
    you can check if there is already a description set for the object by using the search or the getState (withInfo:true).
    it is usefull to set a description for objects that are not well documented or have a specific purpose that is not clear from the standard fields.
    or to save call names to quicker find the object in the future.
    `
export const describe = {
    name:"describe",
    desc: DESC,
    params: {
        id: z.string().describe("the id of the object to describe. This can be a device, channel, state or folder id."),
        desc: z.string().describe("the description to set for the object. This will be stored in the common.desc field of the object. this field is part of the search tool"),
    },
    call: API => async (args) => {
        let ret = await API.describe(args)
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(ret),
                },
            ],
        };
    },
}