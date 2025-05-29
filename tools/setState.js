import {z} from "zod";
const DESC = `the setState tool allows you to set the value of a state in the ioBroker system.
    You can specify the state by its ID, which is usually in the format {instance}.{adapter}.{state} (e.g., "hue.0.brightness").
    The value can be any valid JavaScript value, such as a string, number, boolean, or object.
    If you want to get the value of a state, you can use the getState tool.
    if you want to get a hint about valid values for a state, you can use the getState tool with the withInfo parameter set to true.
    `
export const setState = {
    name:"setState",
    desc: DESC,
    params: {
        id: z.string().describe("The ID of the state to get. This is usually in the format {instance}.{adapter}.{state} (e.g., 'hue.0.brightness')."),
        value: z.any().describe("The value to set for the state. This can be any valid JavaScript value, such as a string, number, boolean, or object."),
    },
    call: API => async (args) => {
        let ret = await API.setState(args)
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