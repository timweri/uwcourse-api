<template>
  <div class="wrapper">
    <div class="page-header header-filter" :style="headerStyle">
      <div class="md-layout">
        <div class="md-layout-item">
          <div class="brand custom-brand">
            <h1>UWCourse</h1>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import BasicElements from './components/BasicElementsSection';
import Navigation from './components/NavigationSection';
import SmallNavigation from './components/SmallNavigationSection';
import Tabs from './components/TabsSection';
import NavPills from './components/NavPillsSection';
import Notifications from './components/NotificationsSection';
import TypographyImages from './components/TypographyImagesSection';
import JavascriptComponents from './components/JavascriptComponentsSection';
import { LoginCard } from '@/components';

export default {
    components: {
        BasicElements,
        Navigation,
        SmallNavigation,
        Tabs,
        NavPills,
        Notifications,
        TypographyImages,
        JavascriptComponents,
        LoginCard,
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
