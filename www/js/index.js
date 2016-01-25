
var texts= {
	"fail": {"de-CH": "Fehler beim herunterladen der Inhalte. Bitte überprüfen Sie die Internetverbindung!",
			 "fr-CH": "Erreur lors du chargement du contenu. Merci de vérifier votre connexion Internet!",
			 "it-CH": "Errore durante il download dei contenuti. Controllare la connessione Internet!"},
	"sync": {"de-CH": "Lade Inhalte",
			 "fr-CH": "Charger le contenu",
			 "it-CH": "Carica contenuti"},
	"configerr": {"de-CH": "Kann Daten nicht laden. Bitte installieren Sie die App erneut!",
			 "fr-CH": "Impossible de charger les données. Merci d’installer à nouveau l’appli!",
			 "it-CH": "Impossibile caricare i dati. Reinstallare l’app!"},
}

var app = {
    // Application Constructor
	lang: "",
	percent: -1,

    initialize: function() {
	this.lang = navigator.language;
		if (this.lang == "de" || this.lang == "it" || this.lang == "fr")
			this.lang = this.lang + "-CH";
		if( this.lang != "de-CH" && this.lang != "it-CH" && this.lang != "fr-CH")
			this.lang = "fr-CH";
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
	},

    onDeviceReady: function() {
		try {navigator.splashscreen.show();} catch( e) {	}

		cordova.plugins.DCSync.on('sync_completed', app.synccompleted);
		cordova.plugins.DCSync.on('sync_failed', app.syncfail);
		cordova.plugins.DCSync.on('sync_progress', app.syncprogress);
		cordova.plugins.DCSync.getLastSync().then(function(date) {
			console.log('lastSync:' + JSON.stringify(date));
			if( date && date.syncDate && date.syncDate > ((new Date().getTime())/1000 - 60*60*24*5 )) {
				app.checkStartPage();
			}
			else {
				app.initSync();
				//force sync first time or after 5 days not synced
			}
		}, app.initSync);
    },
	initSync: function() {
		cordova.plugins.DCSync.setSyncOptions({url:'https://ch-co2tieferlegen.preview.kju.at/DC', username:'anonymous', password:'8FN23!3BNCLFA4$GNHIAKDFFNA2abx0938//', interval: 1440})
			.then(function() {
				console.log('syncOptionsSet:');
				app.startSync();
			}, app.configerr);
	},
	startSync: function() {
		console.log('startSync:');
		app.percent=0;
		app.toast("sync");
		window.setTimeout(app.scheduledToasts, 1500);
		cordova.plugins.DCSync.performSync().then(function() {
		console.log('sync start requested:');
		}, app.configerr)
	},
	configerr: function() {
		app.percent = -1;
		app.toast("configerr");
		//app.exit();
	},
	failure: function() {
		app.toast("fail");
	},
	scheduledToasts: function() {
		if( app.percent != -1 ) {
			window.plugins.toast.show(app.getString("sync") + ": " + app.percent + " %...", "short", 'bottom', function(a){console.log('toast success: ' + a)}, function(b){console.log('toast error: ' + b)});
			window.setTimeout( app.scheduledToasts, 1500);
		}
	},

	exit: function() {
		navigator.app.exitApp();
	},
	toast: function(identifier, length) {
		window.plugins.toast.show(app.getString(identifier), length ? length : "long", 'bottom', function(a){console.log('toast success: ' + a)}, function(b){console.log('toast error: ' + b)});
	},
	syncprogress: function(pro) {
		console.log("sync: " + pro.percent + "%");
		if( pro && pro.percent && pro.percent <= 100 ) {
			app.percent = pro.percent;
		}
	},
	synccompleted: function(pro) {
		console.log('sync completed:');
		app.checkStartPage();
	},
	syncfail: function(a) {
		console.log('sync failed: ' + JSON.stringify(a));
		app.toast("fail");
		//retry after timeout
		window.setTimeout(app.startSync, 10000 );
	},
	getString(identifier) {
		var t =texts[identifier]
		return t[app.lang];
	},

	checkStartPage: function() {
		return  cordova.plugins.DCSync.searchDocuments( {}, {path:"co2tl_app/index.html", maxResults:1, exactMatch:true}).then( function(data) {
				console.log('start page: ' + JSON.stringify(data));
				if( data && data.length>0 && data[0].files && data[0].files.length>0 ) {
					return	cordova.plugins.DCSync.getContentRootUri().then( function(uri) {
						console.log('content root: ' + JSON.stringify(uri));
						if (window.resolveLocalFileSystemURL) {
							window.resolveLocalFileSystemURL(uri, function (entry) {
								var url = entry.toURL() + data[0].files[0] + "?assets=" + encodeURIComponent(cordova.file.applicationDirectory);
								console.log('start page url root: ' + JSON.stringify(url));
								//todo handle errors
								window.location=url;
							});
						}
					}).fail(app.configerr);
				}
				//no startpage present -> config error;
				app.configerr();
		}).fail(app.configerr);
	},

}



app.initialize();




