function exitFullscreen(e){
	e.preventDefault();
	var elem = $$('#map');
	
	if (document.requestFullscreen){
		elem.get(0).exitFullscreen;
	}
	else{
		$$('body').removeClass('fullscreen');
	}	
	elem.hide();
	
}
function enableFullscreen(){

	if (document.requestFullscreen){
		elem.get(0).requestFullscreen();
	}
	else if (document.mozRequestFullScreen){
		elem.get(0).mozRequestFullScreen();
	}
	else if(document.webkitRequestFullscreen){
		elem.get(0).webkitRequestFullscreen();
	}
	else if(document.msRequestFullscreen){
		elem.get(0).msRequestFullscreen();
	}
	else{
		$$('body').addClass('fullscreen');
	}
}

function showMap(){

	var gpxLayer;

	var elem = $$('#map');
	var gpx = elem.attr('data-gps');
	var lat = elem.attr('data-lat');
	var lng = elem.attr('data-lng');
	var filetype = elem.attr('data-type');
	var projfr = elem.attr('data-projfr');
	
	// FULLSCREEN
	elem.css('display','block');
	enableFullscreen();

	
	var map = L.map(document.getElementById('map')); 
	
	map.setView(new L.LatLng(lat, lng),9);				

	// LES CARTES
	
	url = 'https://api.mapbox.com/v4/mapbox.outdoors/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoicmFuZG9icmVpemgiLCJhIjoiY2lzYnFsbXVkMDAweTJ0bWsyYmV0N3lnNyJ9.WirW4hZSlGjsklH-h66T8Q';
	opt = {attribution: '© Mapbox Outdoor'};
	var outdoors = new L.tileLayer(url, opt);

	url = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
	opt = { attribution: "OSM"};
	var osm = new L.TileLayer(url, opt);

	url = 'https://wxs.ign.fr/4iiaysdbxu1x982dgboyrwpf/geoportail/wmts?service=WMTS&request=GetTile&version=1.0.0&tilematrixset=PM&tilematrix={z}&tilecol={x}&tilerow={y}&layer=GEOGRAPHICALGRIDSYSTEMS.MAPS&format=image/jpeg&style=normal';
	opt = {attribution: '© IGN'};
	var ign = new L.TileLayer(url, opt);						

	var satellite = L.tileLayer('https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoicmFuZG9icmVpemgiLCJhIjoiY2lzYnFsbXVkMDAweTJ0bWsyYmV0N3lnNyJ9.WirW4hZSlGjsklH-h66T8Q',{
	attribution: '© Mapbox Satellite'
	});				

	map.addLayer(osm);				

	var baseMaps = {
			"OSM": osm,
			"Outdoors": outdoors,
			"IGN": ign,
			"Satellite": satellite
	};						
	L.control.layers(baseMaps).addTo(map);


	
								
	// LE TRACE GPS
	
	app.request.get(
		gpx,
		null,
		function(data){
			//console.log(data);
			data = (new DOMParser()).parseFromString(data, 'text/xml');
			if(filetype == 'gpx'){
				var geoJson = toGeoJSON.gpx(data);	
			}
			else if(filetype == 'kml'){
				var geoJson = toGeoJSON.kml(data);	
			}

			if(projfr == 1){
				proj4.defs("EPSG:3948", "+proj=lcc +lat_1=47.25 +lat_2=48.75 +lat_0=48 +lon_0=3 +x_0=1700000 +y_0=7200000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
				geoJson.crs = {
					type: "name",
					properties: {
						name: "EPSG:3948"
					}
				};				
			}
					
			gpxLayer = L.Proj.geoJson(geoJson,{
				style:function(geoJsonFeature){
					return {
						color:'#188955'
					}
				},
				pointToLayer: function (feature, latlng) {
						return false;
				}									
			}).addTo(map);
			map.fitBounds(gpxLayer.getBounds(),{
			});
			
			var icon_depart = L.icon({
		  iconUrl:'/img/map_depart.png',
		  iconSize: [32, 37],
		  iconAnchor: [16, 37],
		  popupAnchor:  [0, -35]
		  });			

			L.marker([lat , lng], {
				title:'Départ',
				icon: icon_depart,
			}).bindPopup('Départ').addTo(map);															
		},
		'xml'
	);
	
	
	// LOCALISATION
	
	var locateMarker = L.circleMarker([]);
	L.Control.LocationBar = L.Control.extend({
	
			message: L.DomUtil.create('div'),
			link: L.DomUtil.create('a'),
			
			watchID:null,
			
			onAdd: function(map) {
					var that = this;
			    var div = L.DomUtil.create('div');
			    
					var left = ($$('#map').width() / 2) - 100;
					var top = ($$('#map').height() / 2) - 25;
					$$(that.message).html('Recherche de signal GPS...').addClass('map_msg').css({
						top:top + 'px',
						left:left + 'px'
					}).hide().appendTo($$('#map'));			    
			    
			    $$(div).addClass('leaflet-control-locationbar')
			    	.addClass('leaflet-bar');			    
			    
		    	$$(that.link).html('<i class="material-icons md-only">location_off</i><i class="f7-icons ios-only">location_off</i>')
		    	.on('click',function(){
		    	
		    		if($$(that.link).hasClass('active')){
							that.deactivateGeolocation();
		    		}
		    		else if($$(that.link).hasClass('searching')){
		    			// on ne fait rien
		    		}
		    		else{
		    			$$(that.link).addClass('searching');
		    			that.activateGeolocation();
		    		}
						
		    	})        	
		    	.appendTo($$(div));  


			    return div;
			},
			activateGeolocation:function(){
				var that = this;
				$$(that.message).show();
				that.watchID = navigator.geolocation.watchPosition(
					that.geolocationSuccess,
					that.geolocationError,
		    	{ 
		    		enableHighAccuracy: true,
		    		timeout:30000
		    	});			
			},
			deactivateGeolocation:function(){
				var that = this;
  			$$(that.link).removeClass('active');			    			
  			//map.stopLocate();	
  			$$('.leaflet-control-locationbar').find('i').text('location_off');
  			navigator.geolocation.clearWatch(that.watchID);			    			
  			locateMarker.remove();
  			locateMarker.setLatLng([]);
  			map.fitBounds(gpxLayer.getBounds());			
			},
			
			geolocationSuccess:function(position){
				var that = this;
				
				mypos = L.latLng(position.coords.latitude, position.coords.longitude);
				var oldPos = locateMarker.getLatLng();
				locateMarker.setLatLng(mypos);
				locateMarker.addTo(map);
				if(oldPos == null){
					$$('#map .leaflet-control-locationbar').find('i').text('location_on');
					$$('#map .leaflet-control-locationbar a').addClass('active').removeClass('searching');
					$$('#map .map_msg').hide();
					map.setView(mypos, map.zoom);
				}					
				
			},
			geolocationError:function(error){
				var that = this;	
								
				switch(error.code){
					case error.PERMISSION_DENIED:
						app.dialog.alert("Merci d'activer la position GPS sur votre appareil afin d'utiliser cette fonctionnalité.");
					break;
					case error.POSITION_UNAVAILABLE:
						app.dialog.alert("Votre position n'a pas pu être déterminée par le GPS de votre appareil.");
					break;
					case error.TIMEOUT:
						app.dialog.alert("Votre position n'a pas pu être déterminée par le GPS de votre appareil.");
					break;										
				}
				navigator.geolocation.clearWatch(that.watchID);
				$$('#map .map_msg').hide();
				$$('#map .leaflet-control-locationbar a').removeClass('searching');
			},

			onRemove: function(map) {
			    // Nothing to do here
			}
	});

	L.control.locationBar = function(opts) {
			return new L.Control.LocationBar(opts);
	}
	L.control.locationBar({ position: 'topleft' }).addTo(map);					
	
}
