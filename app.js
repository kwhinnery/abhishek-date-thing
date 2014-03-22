var app = require('gopher'),
    request = require('request'),
    cheerio = require('cheerio');

// Data endpoint
var endpoint = 'http://aa.usno.navy.mil/cgi-bin/aa_pap.pl';

// Hit the Navy site for this data and scrape the request
function dataForDay(year, month, day, callback) {
    request({
        method: 'POST',
        url: endpoint,
        form: {
            FFX: '2',
            ID: 'UCB-CSAS', // an arbitrary ID I made up - the page had a comment
                            // embedded askign that any third parties create an
                            // identifier to flag their own usage of the page.
                            // ID stands for UC Berkeley, Center for South
                            // Asian Studies

            // Date for search
            xxy: year,
            xxm: month,
            xxd: day,

            place: 'New Delhi', // hard code a place name, doesn't seem to
                                // affect data

            xx0: '1', // 1 indicates "east longitude", -1 would be west
            xx1: '77', // degrees longitude
            xx2: '21', // minutes longitude

            yy0: '1', //1 indicates "north latitude", -1 would be south
            yy1: '28', // degrees latitude
            yy2: '61', // minutes latitude

            zz0: '1', // 1 indicates east of Greenwich, -1 is west
            zz1: '5.5' // hour scalar, for either east or west
        } 
    }, function(err, response, body) {
        if (err) {
            callback(err);
        } else {
            // Get response HTML into a queryable object, then grab the <pre>
            // sunrise/sunset data. BTW, this parsing logic can be broken if the
            // format of this page ever changes.
            var $ = cheerio.load(body);
            var tableData = $('pre').text();

            // Get sunrise/sunset data for that day
            var sunriseIndex = 6,
                sunsetIndex = 8,
                lines = tableData.split('\n');

            var filter = function(n) {
                return n !== '';
            };

            // Get 24 hour times for the sunrise/sunset
            var sunrise = lines[sunriseIndex].split(/\s/).filter(filter)[1];
            var sunset = lines[sunsetIndex].split(/\s/).filter(filter)[1];
            
            // return formatted data for the day
            callback(err, {
                sunrise: sunrise,
                sunset: sunset
            });
        }
    });
}

// A tiny API endpoint to easily grab the sunrise/sunset data for the 
app.get('/sunrise/:year/:month/:day', function(request, response) {
    var y = request.param('year'),
        m = request.param('month'),
        d = request.param('day');

    dataForDay(y, m, d, function(err, data) {
        response.send(data);
    });
});