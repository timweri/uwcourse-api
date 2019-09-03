<template>
    <div class="search-bar">
        <div class="search-bar-box" :class="{ focused }">
            <input
                type="search"
                class="search-bar-textbox"
                placeholder="Search..."
                v-model="search"
                @focus="focused = true"
                @blur="focused = false"
                @keyup.enter="fetchResults()"
                @input="fetchResults()" />
        </div>
        <div class="search-suggestion" v-show="search">
            <div v-if="suggestions.length">
                <ul>
                    <li v-for="(suggestion, index) in suggestions"
                        :key="suggestion._id"
                        :index="index">
                        {{ `${suggestion.subject} ${suggestion.catalog_number}: ${suggestion.title}` }}
                    </li>
                </ul>
            </div>
            <div v-else>
                No result found
            </div>
        </div>
    </div>
</template>

<script>
import UWCourseAPI from '../../utils/uwcourse-api';
import _ from 'lodash';

export default {
    props: {
    },
    data() {
        return {
            search: '',
            focused: false,
            suggestions: [],
        };
    },
    created() {
        this.fetchResults = _.debounce(this.fetchResults, 500);
    },
    methods: {
        fetchResults: function () {
            UWCourseAPI.courses.search_courses({
                params: {
                    keywords: this.search,
                    populate: 'latest_detail',
                    limit: 5,
                },
            }).then(response => {
                this.suggestions = [];
                if (response.data.data) {
                    for (const course of response.data.data) {
                        this.suggestions.push({
                            _id: course._id,
                            subject: course.subject,
                            catalog_number: course.catalog_number,
                            title: course.latest_detail.title,
                        });
                    }
                }
            }).catch(e => {
                console.error(e);
                this.suggestions = [];
            });
        },
    },
};
</script>

<style lang="scss" scoped>
.search-bar {
    position: relative;

    .search-bar-box {
        position: relative;
        z-index: 0;
        width: 600px;
        background-color: white;
        display: flex;
        margin-left: auto;
        margin-right: auto;
        border: 1px solid lighten(#000, 80%);
        border-radius: 15px;
        padding: 10px 20px;

        &.focused {
            border: 1px solid lighten(#000, 40%);
        }
    }

    input.search-bar-textbox {
        -webkit-appearance: none !important;
        flex: 1;
        min-width: 150px;
        height: 20px;
        padding: 0;
        border: 0;
        transition: border .2s ease;
        font-size: large;

        &:focus {
            outline: none;
        }
    }

    .search-suggestion {
        display: flex;
        position: absolute;
        width: 100%;
        top: 0;
        z-index: -1;
        background: white;
        overflow: hidden;
        font-size: medium;
        margin-left: auto;
        margin-right: auto;
        padding: 48px 20px 10px;
        border: 1px solid lighten(#000, 80%);
        border-radius: 15px;

        ul {
            list-style-type: none;
            padding: 0;
            margin: 0;

            li {
                padding: 0;
                margin: 0;
            }
        }
    }
}
</style>
