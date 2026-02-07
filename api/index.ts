import { createApp } from "../server/app";

let app: any;

export default async (req: any, res: any) => {
    if (!app) {
        console.log("Initializing Express app for Vercel...");
        const result = await createApp();
        app = result.app;
    }
    return app(req, res);
};
