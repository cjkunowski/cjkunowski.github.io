var map = L.map('map').setView([40.65,-73.93], 12);

var CartoDBTiles = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',{
  attribution: 'Map Data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> Contributors, Map Tiles &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
});

map.addLayer(CartoDBTiles);

var acsGeoJSON;


$.getJSON( "data/acs_data_joined.geojson", function( data ) {
    var dataset = data;

       plotDataset(dataset);

  createListForClick(dataset);
});

function plotDataset(dataset) {
    acsGeoJSON = L.geoJson(dataset, {
        style: acsStyle,
        onEachFeature: acsOnEachFeature
    }).addTo(map);

 createLayerControls(); 
}

var acsStyle = function (feature, latlng) {

    var calc = calculatePercentage(feature);

    var style = {
        weight: 1,
        opacity: .25,
        color: 'grey',
        fillOpacity: fillOpacity(calc[2]),
        fillColor: fillColorPercentage(calc[2])
    };

    return style;

}

function calculatePercentage(feature) {
    var output = [];
    var numerator = parseFloat(feature.properties.ACS_13_5YR_B07201_HD01_VD14);
    var denominator = parseFloat(feature.properties.ACS_13_5YR_B07201_HD01_VD01);
    var percentage = ((numerator/denominator) * 100).toFixed(0);
    output.push(numerator);
    output.push(denominator);
    output.push(percentage);
    return output;    
}

function fillColorPercentage(d) {
    return d > 9 ? '#006d2c' :
           d > 7 ? '#31a354' :
           d > 5 ? '#74c476' :
           d > 3 ? '#a1d99b' :
           d > 1 ? '#c7e9c0' :
                   '#edf8e9';
}

function fillOpacity(d) {
    return d == 0 ? 0.0 :
                    0.75;
}

var popup = new L.Popup();

var count = 0;

var acsOnEachFeature = function(feature,layer){
    var calc = calculatePercentage(feature);


 layer.on("click", function (e) {
        var bounds = layer.getBounds();
        var popupContent = "<strong>Total Population:</strong> " + calc[1] + "<br /><strong>Population Moved to US in Last Year:</strong> " + calc[0] + "<br /><strong>Percentage Moved to US in Last Year:</strong> " + calc[2] + "%";
        popup.setLatLng(bounds.getCenter());
        popup.setContent(popupContent);
        map.openPopup(popup);
    });

 layer._leaflet_id = 'acsLayerID' + count;
    count++;

}

function createLayerControls(){

 var baseMaps = {
        "CartoDB Basemap": CartoDBTiles,
    };

    var overlayMaps = {
        "Percentage Moved to US in Last Year": acsGeoJSON,
    };

L.control.layers(baseMaps, overlayMaps).addTo(map);
    
}

var legend = L.control({position: 'bottomright'});

legend.onAdd = function (map) {

 var div = L.DomUtil.create('div', 'legend'),
        amounts = [0, 1, 3, 5, 7, 9];

        div.innerHTML += '<p>Percentage Population<br />That Moved to US in<br />the Last Year</p>';

        for (var i = 0; i < amounts.length; i++) {
            div.innerHTML +=
                '<i style="background:' + fillColorPercentage(amounts[i] + 1) + '"></i> ' +
                amounts[i] + (amounts[i + 1] ? '% &ndash;' + amounts[i + 1] + '%<br />' : '% +<br />');
        }

    return div;
};

legend.addTo(map);

function createListForClick(dataset) {

   var ULs = d3.select("#list")
              .append("ul");

 ULs.selectAll("li")
        .data(dataset.features)
        .enter()
        .append("li")
        .html(function(d) { 
            return '<a href="#">' + d.properties.ACS_13_5YR_B07201_GEOdisplay_label + '</a>'; 
        })
        .on('click', function(d, i) {
            console.log(d.properties.ACS_13_5YR_B07201_HD02_VD01);
            console.log(i);
            var leafletId = 'acsLayerID' + i;
            map._layers[leafletId].fire('click');
        });


}

$.getJSON( "https://data.cityofnewyork.us/resource/erm2-nwe9.json?$$app_token=rQIMJbYqnCnhVM9XNPHE9tj0g&borough=BROOKLYN&complaint_type=Noise&status=Open", function( data ) {
    var dataset = data;
    // draw the dataset on the map
    plotAPIData(dataset);

});

var apiLayerGroup = L.layerGroup();

function plotAPIData(dataset) {

var ordinalScale = setUpD3Scale(dataset);
  
$.each(dataset, function( index, value ) {

if ((typeof value.latitude !== "undefined" || typeof value.longitude !== "undefined") || (value.latitude && value.longitude)) {

 var latlng = L.latLng(value.latitude, value.longitude);
     
            var apiMarker = L.circleMarker(latlng, {
                stroke: false,
                fillColor: ordinalScale(value.descriptor),
                fillOpacity: 1,
                radius: 5
            });

    apiMarker.bindPopup(value.descriptor);

     apiLayerGroup.addLayer(apiMarker);

        }

    });

    apiLayerGroup.addTo(map);

}

function setUpD3Scale(dataset) {

  var descriptors = [];

$.each(dataset, function( index, value ) {
        descriptors.push(value.descriptor);
    });

 var descriptorsUnique = _.uniq(descriptors);

 var ordinalScale = d3.scale.category20()
        .domain(descriptorsUnique);

    return ordinalScale;

}




