import path from "path";
import url from "url";
import glob from "glob";
import fs from "fs";

import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import CssMinimizerPlugin from "css-minimizer-webpack-plugin";
import CopyPlugin from "copy-webpack-plugin";


const LibShared = "lib";
const ExcludeExamples = new Set(["common"]);

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const exampleFolders = glob.sync("./examples/*/");
const chunks = exampleFolders.map(dirPath => {
    return {name: path.parse(dirPath).name, path: dirPath};
}).filter(chunk => !ExcludeExamples.has(chunk.name));

const exampleEntries = chunks.reduce((obj, chunk) => {
    obj[chunk.name] = {
        import: [
            path.resolve(chunk.path, "index.js"),
            ...glob.sync(path.resolve(chunk.path, "**/*.css")),
            ...glob.sync(path.resolve(chunk.path, "**/*.+(png|svg|jpg|jpeg|gif)")),
        ],
        dependOn: [LibShared]
    };

    return obj;
}, {});

const htmlPlugins = chunks.map(chunk => {
    const template = fs.readFileSync(path.resolve(chunk.path, "index.html"), {encoding: "utf-8"});
    const modified = template
        .replaceAll(/\s*<script.*?>.*?<\/script>/igm, "")
        .replaceAll(/\s*<link.*?>/igm, "");

    return new HtmlWebpackPlugin({
        filename: `./examples/${chunk.name}/index.html`,
        templateContent: modified,
        inject: "body",
        chunks: [LibShared, chunk.name],
    });
});

const isDev = process.env.DEV === "1";

export default {
    mode: "production",
    entry: {
        [LibShared]: {
            import: [
                ...glob.sync("./lib/physics/**/*.js"),
                ...glob.sync("./lib/utils/**/*.js"),
                ...glob.sync("./lib/render/**/*.js"),
                ...glob.sync("./examples/common/**/*.js"),
                "./lib/debug.js",
            ]
        },
        ...exampleEntries,
    },
    devtool: 'source-map',
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: ({chunk: {name}}) => {
            if (!name) {
                return "bundle/[contenthash].js";
            } else if (name === LibShared) {
                return "lib/[name].min.js";
            }
            return `examples/${name}/[name].min.js`;
        },
        assetModuleFilename: "assets/[contenthash][ext]",
        publicPath: isDev ? undefined : "/physics-js/"
    },
    experiments: {
        topLevelAwait: true,
    },
    optimization: {
        splitChunks: {chunks: 'all'},
        usedExports: true,
    },
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: [MiniCssExtractPlugin.loader, "css-loader"],
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource',
            }, {
                test: /\.html$/i,
                loader: "html-loader",
            }
        ],
    }
    ,
    plugins: [
        new CssMinimizerPlugin(),
        new MiniCssExtractPlugin({
            filename: "style/[contenthash].css",
            ignoreOrder: false,
        }),
        new CopyPlugin({
            patterns: [
                {from: "./index.html", to: "./"},
                {from: "./LICENSE", to: "./"}
            ]
        }),
        ...htmlPlugins
    ]
};