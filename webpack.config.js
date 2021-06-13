const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const OverwolfPlugin = require('./overwolf.webpack');

module.exports = {
    entry: {
        background: './windows/background/background.ts',
        overlay: './windows/overlay/overlay.ts',
    },
    devtool: 'inline-source-map',
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: ['.ts', ".js"]
    },
    output: {
      path: `${__dirname}/dist`,
      filename: '[name]/[name].js'
    },
    plugins: [
        new CleanWebpackPlugin,
        new CopyPlugin({
            patterns: [ { from: "public", to: "./" } ],
        }),
        new HtmlWebpackPlugin({
            template: './windows/overlay/overlay.html',
            filename: `${__dirname}/dist/overlay/overlay.html`,
            chunks: ['overlay']
        }),
        new HtmlWebpackPlugin({
            template: './windows/background/background.html',
            filename: `${__dirname}/dist/background/background.html`,
            chunks: ['overlay']
        })
    ]
}