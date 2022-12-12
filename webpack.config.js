import path from "path";
import url from "url";
import glob from "glob";
import fs from "fs";

import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import CssMinimizerPlugin from "css-minimizer-webpack-plugin";

const LibChunks = new Set(["render", "physics", "misc"]);
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
        dependOn: Array.from(LibChunks.values())
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
        chunks: [chunk.name, ...LibChunks.values()],
    });
})

export default {
    mode: "production",
    entry: {
        misc: {
            import: [
                ...glob.sync("./lib/utils/**/*.js"),
                "./lib/debug.js",
            ]
        },
        physics: {import: glob.sync("./lib/physics/**/*.js"), dependOn: "misc"},
        render: {import: glob.sync("./lib/render/**/*.js"), dependOn: "misc"},
        ...exampleEntries,
    },
    devtool: 'source-map',
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: ({chunk: {name}}) => {
            if (!name) {
                return "bundle/[contenthash].js";
            } else if (LibChunks.has(name)) {
                return "lib/[name].min.js";
            }
            return `examples/${name}/[name].min.js`;
        },
        assetModuleFilename: "assets/[contenthash][ext]",
        publicPath: "/physics-js/"
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
        ...htmlPlugins
    ]
}
;