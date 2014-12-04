define([
	'modules/core/src/SongModel',
	'utils/AjaxUtils',
	'utils/UserLog',
	'pubsub'
], function(SongModel, AjaxUtils, UserLog, pubsub) {

	function HarmonizerController(param) {
		this.initEventSubscriber();
	}

	HarmonizerController.prototype.initEventSubscriber = function() {
		var self = this;
		$('#harmonize').click(function() {
			var idSong = $(this).attr('data');
			var style = $('#harmonization_style_select').val();
			self.computeHarmonize(idSong, style);
			return false;
		});

		/*$.subscribe('HarmonizerController-computed', function(el, leadsheet) {
			self.updateHarmonizeView(data);
		});*/
	};

	/*HarmonizerController.prototype.updateHarmonizeView = function(leadsheet) {
		if (typeof leadsheet !== "undefined") {
			// TODO
			console.log('TODO, modify score and player by calling good subscribe');
			// var songModel = new SongModel(leadsheet);
			// editor.songModel = songModel;
			// editor.viewer.draw(editor);
			// playerModel.initFromSongModel(songModel);
		}
	};*/

	HarmonizerController.prototype.computeHarmonize = function(idSong, style) {
		if (!style) {
			style = "Take6";
		}
		$('#harmonize').html('Computing <div id="followingBallsG"><div id="followingBallsG_1" class="followingBallsG"></div><div id="followingBallsG_2" class="followingBallsG"></div><div id="followingBallsG_3" class="followingBallsG"></div><div id="followingBallsG_4" class="followingBallsG"></div></div>');
		this.harmonizeAPI(idSong, style, function(data) {
			$('#harmonize').html('Harmonize');
			if (data.success === true) {
				UserLog.logAutoFade('success', 'Harmonization is finished');
				$.publish('SongModel-reinit', data.sequence); // TODO implement songmodel reinit
			} else {
				UserLog.logAutoFade('error', 'Harmonization is finished');
			}
		});
	};

	HarmonizerController.prototype.harmonizeAPI = function(idSong, style, callback) {
		var request = {
			'id': idSong,
			'setName': style,
		};
		AjaxUtils.servletRequest('flow', 'harmonize', request, callback);
	};

	return HarmonizerController;
});