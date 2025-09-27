import { Moderator } from "../agents";

export default class Environment {
    description: string;
    moderator: Moderator | null;

    constructor(
        description: string = "",
        moderator: Moderator | null = null,
    ) {
        this.description = description;
        this.moderator = moderator;
    }

    getObservation(...args: any[]): any {
        throw new Error("Method not implemented.");
    }

    addMessage(...args: any[]) {
        throw new Error("Method not implemented.");
    }

    async isTerminal(...args: any[]): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
}
