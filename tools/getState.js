import {z} from "zod";
const DESC = `get the value of a state in the ioBroker system.
    You can specify the state by its ID, which is usually in the format {instance}.{adapter}.{state} (e.g., "hue.0.brightness").
    when you provide the withInfo parameter, the result will include additional information about the state, such as its type, common properties, and enums.
    If you want to get the value of a state, you can use the getState tool.
    If you want to set the value of a state, you can use the setState tool.
    `
export const getState = {
    name:"getState",
    desc: DESC,
    params: {
        id: z.string().describe("The ID of the state to get. This is usually in the format {instance}.{adapter}.{state} (e.g., 'hue.0.brightness')."),
        withInfo: z.boolean().optional().default(false).describe("If true, the result will include additional information about the state, such as its type, common properties, roles and enums."),
    },
    call: API => async (args) => {
        let instances = await API.getState(args)
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