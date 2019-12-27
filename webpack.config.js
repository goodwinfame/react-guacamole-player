/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CopyWebpackPlugin = require('copy-webpack-plugin');


const isDev = process.env.NODE_ENV === "development";

const configs = {
    entry: {
        "index": "./src/index.tsx",
        "player": "./src/GuacaPlayer/index.tsx",
        "service-worker": "./src/GuacaPlayer/worker/service-worker.ts",
    },
    target: 'web',
    mode: isDev?"development":"production",
    module: {
        rules: [{
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/,
        },
        {
            test: /\.css$/,
            use: ['style-loader', 'css-loader']
        },
        {
            test: /\.(eot|svg|ttf|woff|woff2)$/,
            use: [{
                loader: 'url-loader',
                options: {
                    esModule: false
                }
            }]
        },
        {
            test: /\.less$/,
            exclude: /node_modules/,
            include: path.resolve(__dirname, 'src'),
            use: [
                'style-loader',
                {
                    loader: 'css-loader',
                    options: {
                        importLoaders: 1,
                    }
                },
                {
                    loader: "postcss-loader",
                    options: {
                        plugins: [
                            require("autoprefixer")
                        ]
                    }
                },
                'less-loader'
            ],
        }],
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            contentBase: path.resolve(__dirname, 'dist'),
            template: path.resolve(__dirname, 'src', 'index.html'),
            filename: 'index.html',
            hash: true, // 防止缓存
            isDev,
            inject: "body",
            chunks: ["index"]
        }),
    ],
    devServer: {
        contentBase: path.resolve(__dirname, 'dist'),
        host: '127.0.0.1', // 主机地址
        port: 3000, // 端口号
        https: true,
        open: false,
        hot: true,
        historyApiFallback: true,
        overlay: {
            errors: true,
        },
        stats: {
            children: false,
            chunks: false,
            assets: false,
            modules: false,
        },
        proxy: {
            "/console": {
                "target": "https://172.16.20.72/",
                "changeOrigin": true,
                "secure": false,
                "pathRewrite": { "^/" : "" }
            },
        }
    },
   
    devtool: 'source-map',
    resolve: {
        extensions: [".ts", ".js", ".tsx"],
    },
    output: {
        globalObject: 'self',
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: isDev?'/':'/cloudit/consoleplayer',
        library: 'GuacaPlayer',
        libraryTarget: 'umd'

    },
    // externals: {      
    //     // Don't bundle react or react-dom      
    //     react: {          
    //         commonjs: "react",          
    //         commonjs2: "react",          
    //         amd: "React",          
    //         root: "React"      
    //     },      
    //     "react-dom": {          
    //         commonjs: "react-dom",          
    //         commonjs2: "react-dom",          
    //         amd: "ReactDOM",          
    //         root: "ReactDOM"      
    //     }  
    // } 
};

if(!isDev) {
    configs.plugins.push(new BundleAnalyzerPlugin({
        analyzerMode: 'disabled',
        generateStatsFile: true,
        statsOptions: { source: false }
    }))
}

module.exports = configs
