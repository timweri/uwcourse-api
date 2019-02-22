exports.possible_faculty = ['Applied Health Sciences', 'Arts', 'Engineering', 'Environment', 'Mathematics', 'Science'];
const valid_programs = {
    'Applied Health Sciences': ['Health Studies', 'Kinesiology', 'Public Health', 'Recreation and Leisure Studies',
        'Recreation and Sport Business', 'Therapeutic Recreation', 'Tourism Development'],
    'Arts': ['Accounting and Financial Management', 'Anthropology', 'Classical Studies',
        'Computing and Financial Management', 'Economics', 'English', 'Fine Arts', 'French',
        'Gender and Social Justice', 'German', 'Global Business and Digital Arts', 'History', 'Honours Arts',
        'Honours Arts and Business', 'Legal Studies', 'Liberal Studies', 'Medieval Studies', 'Music',
        'Peace and Conflict Studies', 'Philosophy', 'Political Science', 'Psychology', 'Religious Studies',
        'Sexuality, Marriage, and Family Studies', 'Social Development Studies', 'Sociology', 'Spanish',
        'Speech Communication', 'Theatre and Performance'],
    'Engineering': ['Architectural Engineering', 'Architecture', 'Biomedical Engineering', 'Chemical Engineering',
        'Civil Engineering', 'Computer Engineering', 'Electrical Engineering', 'Environmental Engineering',
        'Geological Engineering', 'Management Engineering', 'Mechanical Engineering', 'Mechatronics Engineering',
        'Nanotechnology Engineering', 'Software Engineering', 'Systems Design Engineering'],
    'Environment': ['Environment and Business', 'Environment, Resources and Sustainability', 'Geography and Aviation',
        'Geography and Environmental Management', 'Geomatics', 'International Development', 'Knowledge Integration',
        'Planning'],
    'Mathematics': ['Computer Science/Business Administration Double Degree',
        'Mathematics/Business Administration Double Degree', 'Computer Science', 'Data Science',
        'Information Technology Management', 'Computing and Financial Management', 'Mathematics/Business Administration',
        'Mathematics/Chartered Professional Accounting', 'Mathematics/Financial Analysis and Risk Management',
        'Mathematics', 'Actuarial Science', 'Applied Mathematics', 'Biostatistics', 'Combinatorics and Optimization',
        'Computational Mathematics', 'Data Science', 'Mathematical Economics', 'Mathematical Finance',
        'Mathematical Optimization', 'Mathematical Physics', 'Mathematics Teaching', 'Pure Mathematics', 'Statistics'],
    'Science': ['Biotechnology/Chartered Professional Accounting', 'Biotechnology/Economics', 'Environmental Science',
        'Honours Science', 'Life Sciences', 'Biochemistry', 'Biology', 'Biomedical Sciences', 'Psychology',
        'Physical Sciences', 'Chemistry', 'Life Physics', 'Earth Sciences', 'Materials and Nanosciences',
        'Mathematical Physics', 'Medicinal Chemistry', 'Physics', 'Physics and Astronomy', 'Science and Aviation',
        'Science and Business'],
    'Others': ['Optometry', 'Pharmacy', 'Social Work']
};

exports.valid_programs = valid_programs;

// Takes in a String representing a faculty
// Check if the faculty is valid
exports.validate_faculty = (faculty) => {
    return new Promise((resolve, reject) => {
        if (faculty in valid_programs)
            resolve(true);
        else
            reject(false);
    });
};

// Takes in a String representing a program
// Check if the program is valid
exports.validate_program = (program) => {
    let faculty = this.faculty;
    return new Promise((resolve, reject) => {
        if (program in valid_programs[faculty])
            resolve(true);
        else
            reject(false);
    });
};
