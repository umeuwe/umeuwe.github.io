$(document).ready(function() {

	var cities;
	
	var southWest = L.latLng(37, -95),
    northEast = L.latLng(48, -81.5),
    bounds = L.latLngBounds(southWest, northEast);

	var map = L.map('map', {
			center: [43, -89.4],
			zoom: 7,
			minZoom: 6,
			maxZoom: 8,
			maxBounds: bounds
		});
	map.fitBounds(bounds);

	L.tileLayer(
		'http://api.tiles.mapbox.com/v4/umeuwe.wdx11yvi/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoidW1ldXdlIiwiYSI6ImhCMUlHUGsifQ.oKR3yAbedOdOwOCalLly6A', {
			attribution: 'Tileset built in Tilemill, Rent data from US Census Bureau, Inflation calculated with usinflationcalculator.com'
	}).addTo(map);

	$.getJSON("data/MAP.json")
		.done(function(data) {

			var info = processData(data);
			createPropSymbols(info.timestamps, data);
			createLegend(info.min,info.max);
			createSliderUI(info.timestamps);
			createRangeUI(info.timestamps);
		})
		.fail(function() { alert("There has been a problem loading the data.")});

	function processData(data) {
		//this is where data gets turned into useful info
		var timestamps = [];
		var	min = Infinity;
		var	max = -Infinity;
		
		for (var feature in data.features) {
			//find the properties object in current feature
			var properties = data.features[feature].properties;
			//for each attribute in the properties object
			for (var attribute in properties) {

				if (attribute != "city"&&
					attribute != "lat" &&
					attribute != "lon" &&
					attribute != "dist" &&
					attribute != "id")
				{

					//if we test whether that attribute is in the array and nothing shows
					if ($.inArray(attribute,timestamps) === -1){
						timestamps.push(attribute);
					}
					//find min attribute value in the set of all values
					if (properties[attribute] < min){
						min = properties[attribute];
					}
					//find max attribute value in the set of all values
					if (properties[attribute] > max){
						max = properties[attribute];
					}
				}
			}
		}
		return {
			timestamps : timestamps,
			min : min,
			max : max
		}
		for (var feature in data.features) {
			//find the properties object in current feature
			var properties = data.features[feature].properties;
			//for each attribute in the properties object
			for (var attribute in properties) {

				if (attribute === "dist")
					{distance.push(attribute);
					console.log(distance)
				}
		return {distance: distance};	

		}
	}
}// end processData()
	function createPropSymbols(timestamps, data) {

		cities = L.geoJson(data, {

			pointToLayer: function(feature, latlng) {

				return L.circleMarker(latlng, {

				    fillColor: "black",
				    color: "black",
				    weight: 2,
				    fillOpacity: 0.3

				}).on({

					mouseover: function(e) {
						this.openPopup();
						this.setStyle({color: '#FF9900', weight: 5, fillopacity: 0.6});
					},
					mouseout: function(e) {
						this.closePopup();
						this.setStyle({color: 'black', weight: 2});

					}
				});
			}
		}).addTo(map);

		updatePropSymbols(timestamps[0]);

	} // end createPropSymbols()
	function updatePropSymbols(timestamp) {

		cities.eachLayer(function(layer) {

			var props = layer.feature.properties;
			var	radius = calcPropRadius(props[timestamp]);
			var	popupContent = "<b>" + props.city + "</b><br>" +
							   "<i>" + "$" + String(props[timestamp]) + "</i> in </i>" + timestamp + "</i>";
			layer.setRadius(radius);
			layer.bindPopup(popupContent, { offset: new L.Point(0,-radius) });

		});
	} // end updatePropSymbols
	function calcPropRadius(attributeValue) {

		var scaleFactor = 200,
			area = ((((attributeValue-582) * (10-1))/(1000-582)) * scaleFactor);

		return Math.sqrt(area/Math.PI);

	} // end calcPropRadius
	function createLegend(min, max) {

		if (min < 600) {
			min = 600;
		}

		function roundNumber(inNumber) {

       		return (Math.round(inNumber/25) * 25);
		}

		var legend = L.control( { position: 'bottomright' } );

		legend.onAdd = function(map) {

			var legendContainer = L.DomUtil.create("div", "legend");
			var	symbolsContainer = L.DomUtil.create("div", "symbolsContainer");
			var	classes = [roundNumber(min), roundNumber((max-200)), roundNumber(max)];
			var	legendCircle;
			var	lastRadius = 0;
			var currentRadius;
			var margin;

			L.DomEvent.addListener(legendContainer, 'mousedown', function(e) {
				L.DomEvent.stopPropagation(e);
			});

			$(legendContainer).append("<h2 id='legendTitle'>Median Rent per Month</h2>");

			for (var i = 0; i <= classes.length-1; i++) {

				legendCircle = L.DomUtil.create("div", "legendCircle");

				currentRadius = calcPropRadius(classes[i]);

				margin = -currentRadius - lastRadius - 2;

				$(legendCircle).attr("style", "width: " + currentRadius*2 +
					"px; height: " + currentRadius*2 +
					"px; margin-left: " + margin + "px" );

				$(legendCircle).append("<span class='legendValue'>"+classes[i]+"<span>");

				$(symbolsContainer).append(legendCircle);

				lastRadius = currentRadius;

			}

			$(legendContainer).append(symbolsContainer);

			return legendContainer;

		};

		legend.addTo(map);
	} // end createLegend()
	function createSliderUI(timestamps) {

		var sliderControl = L.control({ position: 'bottomleft'} );

		sliderControl.onAdd = function(map) {

			var slider = L.DomUtil.create("input", "range-slider");

			L.DomEvent.addListener(slider, 'mousedown', function(e) {

				L.DomEvent.stopPropagation(e);

			});

			$(slider)
				.attr({
					'type':'range', 
					'max': timestamps.length-1,
					'min':0,
					'step': 1,
					'value': 8})
		        .on('input change', function() {
		        	updatePropSymbols(timestamps[$(this).val()]);
		            $(".temporal-legend").text(timestamps[this.value]);
		        });

			return slider;
		}

		sliderControl.addTo(map);
		createTemporalLegend(timestamps[8]);
	} // end createSliderUI()

	function createTemporalLegend(startTimestamp) {

		var temporalLegend = L.control({ position: 'bottomleft' });

		temporalLegend.onAdd = function(map) {

			var output = L.DomUtil.create("output", "temporal-legend");
			$(output).text(startTimestamp);
			return output;
		}

		temporalLegend.addTo(map);
	}	// end createTemporalLegend()

function createRangeUI(price) {

		var sliderControl = L.control({ position: 'topright'} );

		sliderControl.onAdd = function(map) {

			var slider = L.DomUtil.create("input", "price-slider");

			L.DomEvent.addListener(slider, 'mousedown', function(e) {

				L.DomEvent.stopPropagation(e);

			});

			$(slider)
				.attr({
					'type':'range', 
					'max': 1000,
					'min':500,
					'step': 25,
					'value': 1000})
		        .on('input change', function() {
		        	updatePropSymbols(timestamps[$(this).val()]);
		            $(".price-legend").text(timestamps[this.value]);
		        });

			return slider;
		}

		sliderControl.addTo(map);
		createTemporalLegend(timestamps[0]);
	} // end createSliderUI()

	function createRangeLegend(startTimestamp) {

		var temporalLegend = L.control({ position: 'bottomleft' });

		temporalLegend.onAdd = function(map) {

			var output = L.DomUtil.create("output", "range-legend");
			$(output).text(startTimestamp);
			return output;
		}

		temporalLegend.addTo(map);
	}	// end createTemporalLegend()














});
