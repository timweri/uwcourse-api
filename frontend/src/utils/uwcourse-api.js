import axios from 'axios';

const host = 'http://localhost:5000';
const api_endpoint = `${host}/api/v1`;

const UWCourseAPI = {
    courses: {
        search_courses: (config) => {
            return axios.get(`${api_endpoint}/courses`, config);
        },
    },
};

export default UWCourseAPI;
