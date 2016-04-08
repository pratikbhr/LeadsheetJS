define([
	'modules/AudioComments/src/AudioCommentsController',
	'modules/ChordEdition/src/ChordEdition',
	'modules/chordSequence/src/SongView_chordSequence',
	"modules/converters/MusicCSLJson/src/main",
	"modules/converters/MusicXML/src/main",
	"modules/core/src/main", // most important module
	'modules/Cursor/src/Cursor',
	'modules/Edition/src/Edition',
	'modules/FileEdition/src/FileEdition',
	'modules/History/src/HistoryC',
	'modules/LSViewer/src/LSViewer',
	'modules/LSViewer/src/OnWindowResizer',
	'modules/MainMenu/src/MainMenu',
	'modules/MidiCSL/src/main',
	'modules/NoteEdition/src/NoteEdition',
	'modules/NoteEdition/src/NoteSpaceManager',
	'modules/PlayerView/src/PlayerView',
	'modules/core/src/SongModel',
	'modules/converters/MusicCSLJson/src/SongModel_CSLJson',
	'modules/StructureEdition/src/StructureEdition',
	'modules/Tag/src/TagManager',
	'utils/main',
	'modules/Audio/src/AudioModule',
	'modules/Edition/src/KeyboardManager',
	'jquery'
], function(
	AudioComments,
	ChordEdition,
	chordSequence,
	convertersMusicCSLJson,
	convertersMusicXML,
	core,
	Cursor,
	Edition,
	FileEdition,
	HistoryC,
	LSViewer,
	OnWindowResizer,
	MainMenu,
	MidiCSL,
	NoteEdition,
	NoteSpaceManager,
	PlayerView,
	SongModel,
	SongModel_CSLJson,
	StructureEdition,
	TagManager,
	utils,
	AudioModule,
	KeyboardManager,
	$
) {
	function singleton(constructorFn){
		var instance;
		return {
			getInstance: function(){
				if (!instance) {
					instance = constructorFn(arguments);
				}
				return instance;
			}
		};
	};
	var notesCursorConstructor = function(args){	
		var songModel = args[0];
		return cursorConstructor(songModel, 'notes');
	}
	var playerCursorConstructor = function(args){	
		var songModel = args[0];
		return cursorConstructor(songModel, 'player');
	}
	var cursorConstructor = function(songModel, id){
		return new Cursor(songModel.getComponent('notes'), id, 'arrow').model;
	};
	var snglNotesCursor = (singleton)(notesCursorConstructor);
	var snglPlayerCursor = (singleton)(playerCursorConstructor);

	var snglNotesManager = (singleton)(function(args){
		var songModel = args[0];
		var viewer = args[1];
		return new NoteSpaceManager(snglNotesCursor.getInstance(songModel), viewer, 'NotesCursor', null, true, false);
	})

	var snglKeyBoardManager = (singleton)(function(){
		return new KeyboardManager(false);
	});

	function loadViewer(htmlElem, options, song){
		options = options || {};
		var viewer = new LSViewer(htmlElem, options);
		OnWindowResizer(song);
		return viewer;
	}

	function loadPlayer(options, songModel){
		
		function loadMidiPlayer(playerView, soundfontUrl){
			var player = new MidiCSL.PlayerModel_MidiCSL(songModel, soundfontUrl, {
				cursorModel: snglPlayerCursor.getInstance(songModel),
				cursorNoteModel: snglNotesCursor.getInstance(songModel)
			});
			new MidiCSL.PlayerController(player, playerView);
			return player;
		}

		
		var useAudio = !!options.audio;
		var useMidi = options.midi && options.midi.soundfontUrl;

		var playerViewOptions = options.viewOptions;
		playerViewOptions.displaySwitch = useAudio && useMidi && options.audio.audioFile; //if audioFile is not defined, we do not load displayTypeSwitch
		playerViewOptions.tempo = !isNaN(songModel.getTempo()) ? songModel.getTempo() : null;
		
		var playerView = new PlayerView(options.HTMLElement, options.imgUrl, playerViewOptions);
		
		new NoteSpaceManager(snglPlayerCursor.getInstance(songModel), viewer, 'PlayerCursor', "#0AA000", false, false);
		
		if (options.interactive) {
			snglNotesManager.getInstance(songModel, viewer);
		}
		
		snglKeyBoardManager.getInstance();

		if (useMidi) {
				loadMidiPlayer(playerView, options.midi.soundfontUrl);
				//loadedModules.midiPlayer = LJS._loadMidiPlayer(MidiCSL, songModel, soundfontUrl, loadedModules.playerView, cursorPlayerModel, cursorNoteModel);
		}

		if (useAudio) {
			$.publish('ToMidiPlayer-disable');
			var audioModule = new AudioModule(songModel, 
			{
				viewer: viewer,
				notesCursor: snglPlayerCursor.getInstance()
			});
				if (options.audio.audioFile) {
				audioModule.load(options.audio.audioFile, options.audio.tempo);
			}
		}
	}

	function loadEdition(viewer, songModel, menuHTML, params){
		snglKeyBoardManager.getInstance();
		var menuModel;
		if (menuHTML && (params.notes || params.chords || params.structure)){
			menu = new MainMenu(menuHTML);	
			menuModel = menu.model;
			menuModel.options = {};
			if (params.notes) {
				menuModel.options.notes = {
					active: true,
					menu: {
						title: 'Notes',
						order: 3
					},
					imgPath: params.imgUrl.notes
				};
			}
			if (params.chords) {
				menuModel.options.chords = {
					active: true,
					/// menu: {
					//	title: 'Chords',
					//	order: 4
					//},
					imgPath: params.imgUrl.chords,
					menu: false // if we don't want menu
				};
			}
			if (params.structure) {
				menuModel.options.structure = {
					active: true,
					menu: {
						title: 'Structure',
						order: 5
					},
					imgPath: params.imgUrl.structure
				};
			}
		}
		if (params.notes){
			params.snglNotesManager = snglNotesManager;
			params.snglNotesCursor = snglNotesCursor;
		}
		var edition = new Edition(viewer, songModel, menuModel, params);
		//var edition = new Edition(viewer, songModel, menu.model, modules);
		
		
	}
	
	
	var LJS = {
		"AudioComments": AudioComments,
		"ChordEdition": ChordEdition,
		"chordSequence": chordSequence,
		"converters": {
			"MusicCSLJson": convertersMusicCSLJson,
			"MusicXML": convertersMusicXML
		},
		"core": core,
		"Cursor": Cursor,
		"Edition": Edition,
		"FileEdition": FileEdition,
		"HistoryC": HistoryC,
		"LSViewer": LSViewer,
		"OnWindowResizer": OnWindowResizer,
		"MainMenu": MainMenu,
		"MidiCSL": MidiCSL,
		"NoteEdition": NoteEdition,
		"StructureEdition": StructureEdition,
		"Tag": TagManager,
		//"Wave": Wave,
		"utils": utils
	};

	LJS.init = function(MusicCSLJSON, params) {
		if (MusicCSLJSON === undefined) {
			throw "missing MusicCLJSON song";
		}
		
		var songModel = SongModel_CSLJson.importFromMusicCSLJSON(MusicCSLJSON);
		var useViewer = params.viewer !== undefined;
		var usePlayer = params.player !== undefined;
		var useEdition = params.edition !== undefined;
		
		// Viewer
		
		if (useViewer) {
			if (params.viewer.HTMLElement === undefined) {
				throw "Missing HTMLElement for viewer";
			}
			viewer = loadViewer(params.viewer.HTMLElement, params.viewer.viewOptions, songModel);
			
		}

		// Player
		if (usePlayer) {
			if (params.player.HTMLElement === undefined) {
				throw "Missing HTMLElement for player";
			}

			loadPlayer(params.player, songModel);
		}

		if (useEdition) {
			var menuHTML = params.edition.menu !== undefined ? params.edition.menu.HTMLElement : false;
			loadEdition(viewer, songModel, menuHTML, params.edition);
			
			//menu	
			menu.controller.loadStateTab();
			if (menu.model.getCurrentMenu() === undefined) {
				menu.controller.activeMenu('Notes');
			}
			//history
			if (params.edition.history){
				if (!params.edition.history.HTMLElement){
					throw "Missing HTMLElement for history";		
				}
				var historyHTML = params.edition.history.HTMLElement;
				new HistoryC(songModel, historyHTML, null, true, false);
				$.publish('ToHistory-add', 'Open song - ' + songModel.getTitle());
			}
			
		}

		//tags
		if (params.tags){
			// TagManager take as argument your array of tags here call analysis, an array of color (here undefined because we use built in colors)
			new TagManager(songModel, snglNotesManager.getInstance(songModel,viewer), params.tags, undefined, true, false);
		}

		if (useViewer){
			viewer.draw(songModel);
		}
		
		//return loadedModules;
	};



	LJS._loadChordSequence = function() {
		var optionChediak = {
			displayTitle: true,
			displayComposer: true,
			displaySection: true,
			displayBar: true,
			delimiterBar: "",
			delimiterBeat: "/",
			unfoldSong: false, //TODO unfoldSong is not working yet
			fillEmptyBar: false,
			fillEmptyBarCharacter: "%",
		};
		new chordSequence($('#chordSequence1')[0], songModel, optionChediak);
	};

	// LJS._loadComments = function(waveMng, viewer, songModel) {
	// 	var userSession = {
	// 		name: 'Dani',
	// 		id: '323324422',
	// 		img: '/tests/img/dani-profile.jpg'
	// 	};
	// 	var audioComments = new AudioComments(waveMng, viewer, songModel, userSession);
	// 	return audioComments;
	// };


	return LJS;
});