var storage = window.localStorage;

var app = new Framework7({
  root: '#app',
  name: 'Randobreizh',
  id: 'fr.randobreizh.www',
  // Add default routes
  routes: [
    {
      path: '/',
      url: 'home.html',
			on: {
        pageInit: function (e, page) {
        	
        	// affiche les randonnées
        	createList('.randos-list');
					showRandos({}, function(){});
					
					$$('.button-filter').on('click', function(){
  					var formData = app.form.convertToData('#form-filter');
  					showRandos(formData, function(){
  						app.popup.close('.popup-filter');
  					});
  					
					});  
					
					$$('.popup-filter').on('popup:open', function (e, popup) {
						console.log('About popup open');
		
						var autocomplete = app.autocomplete.create({
							inputEl: '#depart',
							openIn: 'dropdown',
							preloader:true,
							limit:20,
 							valueProperty: 'name', //object's "value" property name
  						textProperty: 'name', //object's "text" property name							
							source: function (query, render) {
								var autocomplete = this;
								var results = [];
								if (query.length === 0) {
									render(results);
									return;
								}
								// Show Preloader
								autocomplete.preloaderShow();						
								app.request.json('https://randobreizh.fr/content/plugins/randoapp/appli_datas.php',
									{
										action:'search',
										input: query
									},
									function (data) {
										// Hide Preoloader
										autocomplete.preloaderHide();
										json = JSON.parse(data);	
										var items = [];
										for (var i = 0; i < json.predictions.length; i++) {
											items.push({
												name: json.predictions[i].description
											});
										}
										render(items);
									},
									function(xhr, status){
										console.log('error');
									}							
								);    
				
							}
						});  
		
					});					      
         
        },
      }      
    },
    {
      path: '/randos/',
      url: 'randos.html',
			on: {
        pageInit: function (e, page) {
        	
        	// affiche les randonnées
        	createList('.myrandos-list');
					showMyRandos({}, function(){});        
        },
      }      
    },
    {
      path: '/account/',
      url: 'account.html',
    },  
    {
      path: '/single-rando/:id',
      url: 'single-rando.html',
			on: {
        pageInit: function (e, page) { 
        	var postid = page.route.params.id;
        	if(!storage.getItem('rando' + postid)) { 
						app.request.get('https://randobreizh.fr/content/plugins/randoapp/appli_datas.php', {
							action: 'single',
							id: postid
						}, function (json) {
							json = JSON.parse(json);	
							showRando(json);
							storage.setItem('rando' + postid, JSON.stringify(json));
						});		
					}	
					else{
						showRando(JSON.parse(storage.getItem('rando' + postid)));
					}	
        }
      }       
    },            
  ],
  
});

var $$ = Dom7;
// Init/Create views
var homeView = app.views.create('#view-home', {
  url: '/'
});
var randosView = app.views.create('#view-randos', {
  url: '/randos/'
});
var accountView = app.views.create('#view-account', {
  url: '/account/'
});



function showRando(rando){
	var randoTemplate = $$('#single-rando').html();
	var compiledRandoTemplate = Template7.compile(randoTemplate);
	var html = compiledRandoTemplate(rando);
	$$('#single-rando').html(html);
	
	if(storage.getItem('myrando' + rando.ID)){
		$$('#single-rando #save-rando').hide();
	}
	else{
		$$('#single-rando #saved-rando').hide();
	}
	
	$$('#show-map').on('click',function(){
		showMap();
	});
	$$('#save-rando').on('click',function(){
		var rando_id = $$(this).data('id');
		saveRando(rando_id);
	});	
}

function saveRando(rando_id){

	var rando = JSON.parse(storage.getItem('rando' + rando_id));
	console.log(rando.gps_file);
	
	var gps_ext = rando.gps_file.split('.');
	gps_ext = gps_ext[gps_ext.length - 1];
	console.log(gps_ext);
	
	var thumb_ext = rando.thumbnail.split('.');
	thumb_ext = thumb_ext[thumb_ext.length - 1];
	console.log(thumb_ext);	
	
	downloadFile(encodeURI(rando.gps_file), 'rando-'+rando_id + '.' + gps_ext, function(fileEntry){
		rando.gps_file = fileEntry.toURL();
		
		
		downloadFile(encodeURI(rando.thumbnail), 'rando-'+rando_id + '.' + thumb_ext, function(fileEntry){
			rando.thumbnail = fileEntry.toURL();
			
			console.log(rando);
			
			if(!storage.getItem('myrandos')) { 
				var randos = [];
			}
			else{
				var randos = storage.getItem('myrandos');
			}
			randos.push({
					id: rando.ID,
					title: rando.post_title,
					subtitle: rando.location,
					thumbnail: rando.thumbnail			
			});
			
			storage.setItem('myrando' + rando_id, JSON.stringify(rando));
			storage.setItem('myrandos', JSON.stringify(randos));
			showMyRandos({}, function(){});
		});		
	});
	
}



function showMyRandos(){
	var items = [];
	console.log(storage.getItem('myrandos'));
	if(storage.getItem('myrandos')) {
		items = JSON.parse(storage.getItem('myrandos'));
		console.log(items);
	}
	populateSearch('.myrandos-list', items);
}

function showRandos(data, callback){
	if(!storage.getItem('randos') || true) {
		var items = [];
		app.request.get('https://randobreizh.fr/content/plugins/randoapp/appli_datas.php', data, function (json) {
			json = JSON.parse(json);
			for(i in json){
				var rando = json[i];
				items.push({
					id: rando.ID,
					title: rando.post_title,
					subtitle: rando.location,
					thumbnail: rando.thumbnail,
					latlng:{ 
						lat:rando.lat, 
						lng:rando.lng
					}
				});				
			}
			storage.setItem('randos', JSON.stringify(items));
			populateSearch('.randos-list',items);
			$$('#nb_randos').text(items.length);
			callback();
		});
		
	}
	else{
		items = JSON.parse(storage.getItem('randos'));
		populateSearch('.randos-list', items);
		$$('#nb_randos').text(items.length);
		callback();		
	}
}

function createList(el){
	var list = app.virtualList.get(el);
	app.virtualList.create({
		// List Element
		el: el,
		// Pass array with items
		items: {},
		// List item Template7 template
		itemTemplate:
		  '<li>' +
		    '<a href="/single-rando/{{id}}" class="item-link item-content">' +
					'<div class="item-media">' +
         		'<img src="{{thumbnail}}">' +
        	'</div>'+   
		      '<div class="item-inner">' +
		        '<div class="item-title-row">' +
		          '<div class="item-title">{{title}}</div>' +
		        '</div>' +
		        '<div class="item-subtitle">{{subtitle}}</div>' +
		      '</div>' +
		    '</a>' +
		  '</li>',
	});
}

function populateSearch(el,items){
	var list = app.virtualList.get(el);
	console.log(items);
	list.replaceAllItems(items);
	list.update();
	
}

function onLoad(){
	document.addEventListener("deviceready", onDeviceReady, false);
}
function onDeviceReady(){
	document.addEventListener("backbutton", onBackButton, false);
	document.addEventListener('keyup', onKeyUp, false);
}
function onBackButton(e){
	backEscapeActions(e);
}

function onKeyUp(e){
	switch(e.which){
		case 27:
			backEscapeActions(e);
		break;
	}
}

function backEscapeActions(e){
	// si on est sur la carte en plein écran, on en sort
	if($$('body').hasClass('fullscreen')){
		exitFullscreen(e);
	}
	else if($$('.popup-filter').css('display') == 'block'){
		app.popup.close('.popup-filter');
	}
	else{	
		var leave = true;
		var tabActive = $$('.tab-active');
		switch(tabActive.attr('id')){
			case 'view-home':
				if($$('.page-current').attr('data-name') == 'single-rando'){
					leave = false;
					app.views.current.router.navigate('/');	
				}
			break;
		}
		if(leave){
			app.dialog.confirm("Quitter l'appli Randobreizh ?", 'Quitter', function(){
				navigator.app.exitApp();
			}, function(){
			
			});		
		}
	
	}
}


