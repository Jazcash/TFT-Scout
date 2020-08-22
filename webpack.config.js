const HtmlWebpackPlugin = require('html-webpack-plugin');

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
        extensions: ['.ts']
    },
    output: {
      path: `${__dirname}/dist`,
      filename: '[name]/[name].js'
    },
    plugins: [
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