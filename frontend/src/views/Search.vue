<template>
  <div class="wrapper">
    <div class="page-header header-filter">
      <div class="md-layout">
        <div class="md-layout-item">
          <big-search-bar></big-search-bar>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import BigSearchBar from './components/BigSearchBar';

export default {
    components: {
        BigSearchBar,
    },
    name: 'index',
    bodyClass: 'index-page',
    props: {
        signup: {
            type: String,
            default: require('@/assets/img/city.jpg'),
        },
        landing: {
            type: String,
            default: require('@/assets/img/landing.jpg'),
        },
        profile: {
            type: String,
            default: require('@/assets/img/profile.jpg'),
        },
    },
    data() {
        return {
            firstname: null,
            email: null,
            password: null,
        };
    },
};
</script>

<style lang="scss">
.index-page .brand.custom-brand {
  color: $uw-gold;

  h1, h2, h3 {
    text-shadow: none;
  }
}

.section-download {
  .md-button + .md-button {
    margin-left: 5px;
  }
}

@media all and (min-width: 991px) {
  .btn-container {
    display: flex;
  }
}
</style>
