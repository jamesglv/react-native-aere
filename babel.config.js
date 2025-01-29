module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            "nativewind/babel",
            [
                "module:react-native-dotenv",
                {
                    moduleName: "@env", // Ensure this matches your import path
                    path: ".env",        // Path to your .env file
                },
            ],
            ["module-resolver", {
                root: ["./"],

                alias: {
                    "@": "./",
                    "tailwind.config": "./tailwind.config.ts"
                }
            }]
        ],
    };
};
