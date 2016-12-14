// ==UserScript==
// @name         Gazelle notificatons from last.fm top artists
// @namespace    http://savagecore.eu/
// @version      0.1.0
// @description  Generate notifications on Gazelle sites based upon Last.FM top artists.
// @author       SavageCore

// @include    http*://passtheheadphones.me/user.php?action=notify*
// @include    http*://apollo.rip/user.php?action=notify*

// @downloadURL	 https://github.com/SavageCore/gazelle-lastfm-notifications/raw/master/src/gazelle-lastfm-notifications.user.js
// @grant								GM_getValue
// @grant								GM_setValue
// @grant								GM_xmlhttpRequest
// ==/UserScript==

/*	global document GM_xmlhttpRequest GM_getValue GM_setValue */
/*	eslint new-cap: "off"	*/

document.addEventListener('DOMContentLoaded', (function () {
	'use strict';
	createOptionsForm();
	loadSettings();

	var fetchButton = document.getElementById('sc_gln_fetch');
	fetchButton.addEventListener('click', function () {
		var options = getSettings();
		getTopArtists(options);
	}, false);

	function getTopArtists(options) {
		var artistString = '';
		GM_xmlhttpRequest({
			method: 'GET',
			url: 'https://ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=' + options.userName + '&api_key=' + options.apiKey + '&period=' + options.period + '&limit=' + options.limit + '&format=json',
			onload: function (response) {
				if (response.status === 200) {
					var data = JSON.parse(response.responseText);
					for (var key in data.topartists.artist) {
						if ({}.hasOwnProperty.call(key, '0')) {
							artistString += data.topartists.artist[key].name + ',';
						}
					}
					var titleElement = document.getElementsByName('label1')[0];
					var artistElement = document.getElementsByName('artists1')[0];

					titleElement.value = 'Top ' + options.limit + ' Last.FM Artists (' + options.period + ')';
					artistString = artistString.replace(/(,$)/, '');
					artistElement.innerText = artistString;
				}
			}
		});
	}

	function createOptionsForm() {
		var element = document.getElementById('filter_form');
		var viewToggle = GM_getValue('viewToggle', false);
		element.insertAdjacentHTML('beforebegin', '<div class="head"><strong>Last.FM Settings</strong><span style="float: right;"><a href="#" id="sc_gln_showhide" onclick="$(\'#sc_gln_settings\').gtoggle(); this.innerHTML = (this.innerHTML == \'Show\' ? \'Hide\' : \'Show\'); return false;" class="brackets">Hide</a></span></div><table cellpadding="6" cellspacing="1" border="0" width="100%" class="layout border user_options" id="sc_gln_settings"><tbody><tr id="sc_gln_username_tr"><td class="label tooltip" title="Last.FM username"><strong>Last.FM username</strong></td><td><input type="text" size="40" name="sc_gln_username" id="sc_gln_username" value></td></tr><tr id="sc_gln_apikey_tr"><td class="label tooltip" title="Last.FM API Key"><strong>Last.FM API Key (Get one <a href=\'http://www.last.fm/api/account/create\' target=\'_blank\'>here</a>)</strong></td><td><input type="text" size="40" name="sc_gln_apikey" id="sc_gln_apikey" value></td></tr><tr id="sc_gln_period_tr"><td class="label tooltip" title="Top artists over timespan"><strong>Period</strong></td><td><select name="sc_gln_period" id="sc_gln_period"><option value="overall">Overall</option><option value="7day">7 Days</option><option value="1month">1 Month</option><option value="3month">3 Months</option><option value="6month">6 Months</option><option value="12month">12 Months</option></select></td></tr><tr id="sc_gln_limit_tr"><td class="label tooltip" title="Limit number of Artists"><strong>Number of Artists</strong></td><td><input type="text" size="40" name="sc_gln_limit" id="sc_gln_limit" value></td></tr><tr id="sc_gln_viewtoggle_tr"><td class="label tooltip" title="Hide this options form on page load"><strong>Hide on load</strong></td><td><input type="checkbox" name="sc_gln_viewtoggle" id="sc_gln_viewtoggle"></td></tr><tr><td colspan="2" class="center"><input type="submit" id="sc_gln_submit" value="Save Settings">&nbsp;<input type="submit" id="sc_gln_fetch" value="Fetch"></td></tr></tbody></table><div class="head colhead_dark"></div>');
		var submitButton = document.getElementById('sc_gln_submit');
		submitButton.addEventListener('click', saveSettings, false);
		var settingsElement = document.getElementById('sc_gln_settings');
		if (viewToggle === true) {
			document.getElementById('sc_gln_showhide').innerText = 'Show';
			settingsElement.className += ' hidden';
		}
	}

	function getSettings() {
		var userName = document.getElementById('sc_gln_username').value;
		var apiKey = document.getElementById('sc_gln_apikey').value;
		var period = document.getElementById('sc_gln_period').value;
		var limit = document.getElementById('sc_gln_limit').value;
		return {
			userName: userName,
			apiKey: apiKey,
			period: period,
			limit: limit
		};
	}

	function loadSettings() {
		var userName = document.getElementById('sc_gln_username');
		var apiKey = document.getElementById('sc_gln_apikey');
		var period = document.getElementById('sc_gln_period');
		var limit = document.getElementById('sc_gln_limit');
		var viewToggle = document.getElementById('sc_gln_viewtoggle');
		userName.value = GM_getValue('userName', '');
		apiKey.value = GM_getValue('apiKey', '');
		selectItemByValue(period, GM_getValue('period', 'overall'));
		viewToggle.checked = GM_getValue('viewToggle', false);
		limit.value = GM_getValue('limit', '50');
	}

	function saveSettings() {
		var userName = document.getElementById('sc_gln_username').value;
		var apiKey = document.getElementById('sc_gln_apikey').value;
		var period = document.getElementById('sc_gln_period').value;
		var limit = document.getElementById('sc_gln_limit').value;
		var viewToggle = document.getElementById('sc_gln_viewtoggle').checked;
		GM_setValue('userName', userName);
		GM_setValue('apiKey', apiKey);
		GM_setValue('period', period);
		GM_setValue('limit', limit);
		GM_setValue('viewToggle', viewToggle);
	}

	function selectItemByValue(elem, value) {
		for (var i = 0; i < elem.options.length; i++) {
			if (elem.options[i].value === value) {
				elem.selectedIndex = i;
			}
		}
	}
})(), false);
