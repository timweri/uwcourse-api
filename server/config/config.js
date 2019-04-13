// TIME_ZONE_OFFSET is defined as a UTC offset
// The timezone would be UTC+<TIME_ZONE_OFFSET>
exports.TIME_ZONE_OFFSET = -5; // EST

exports.JWT_SECRET = 'myMameIsSiddAndILikeCheese';

exports.development = {
    port: process.env.PORT || 5000,
    saltingRounds: 10
}
