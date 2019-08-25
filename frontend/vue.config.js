module.exports = {
    css: {
        loaderOptions: {
            css: {
                sourceMap: process.env.NODE_ENV !== 'production',
            },
            sass: {
                data: '@import "@/assets/scss/global.scss";',
            },
        },
    },
};
