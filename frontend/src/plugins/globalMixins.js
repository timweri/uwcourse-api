/**
 * You can register global mixins here
 */

const GlobalMixins = {
    install(Vue) {
        Vue.mixin({
            mounted() {
                const { bodyClass } = this.$options;
                if (bodyClass) {
                    document.body.classList.add(bodyClass);
                }
            },
            beforeDestroy() {
                const { bodyClass } = this.$options;
                if (bodyClass) {
                    document.body.classList.remove(bodyClass);
                }
            },
        });
    },
};

export default GlobalMixins;
