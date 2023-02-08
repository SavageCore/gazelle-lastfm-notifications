// ==UserScript==
// @name					Gazelle notificatons from last.fm top artists
// @namespace			http://savagecore.eu/
// @version				0.3.11
// @description		Generate notifications on Gazelle sites based upon Last.FM top artists.
// @author				SavageCore
// @include				http*://redacted.ch/user.php?action=notify*
// @include				http*://orpheus.network/user.php?action=notify*
// @downloadURL		https://github.com/SavageCore/gazelle-lastfm-notifications/raw/master/src/gazelle-lastfm-notifications.user.js
// @grant					GM_getValue
// @grant					GM_setValue
// @grant					GM_xmlhttpRequest
// @grant					GM_notification
// @grant					GM.getValue
// @grant					GM.setValue
// @grant					GM.xmlHttpRequest
// @grant					GM.notification
// @require      	https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @require				https://gist.github.com/SavageCore/53cfc8fb0a6c8b4d3ad0be26bf21973c/raw/1434f8f22190c952ff1b47040353d383de552492/shimGMNotification.js
// @connect				ws.audioscrobbler.com
// @run-at				document-end
// ==/UserScript==

/*	global document GM shimGMNotification window */
/*	eslint new-cap: "off"	*/

(async function () {
	shimGMNotification();
	createOptionsForm();
	await loadSettings();

	const fetchButton = document.querySelector('#sc_gln_fetch');
	fetchButton.addEventListener('click', () => {
		const options = getSettings();
		switch (document.querySelector('#sc_gln_mode').value) {
			case 'artists': {
				getTopArtists(options);
				break;
			}

			case 'loved': {
				getLovedArtists(options);
				break;
			}

			default:
		}
	}, false);

	function getTopArtists(options) {
		if (options.userName && options.apiKey && options.period && options.limit) {
			let artistString = '';
			GM.xmlHttpRequest({
				method: 'GET',
				url: 'https://ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=' + options.userName + '&api_key=' + options.apiKey + '&period=' + options.period + '&limit=' + options.limit + '&format=json',
				onload(response) {
					if (response.status === 200) {
						const data = JSON.parse(response.responseText);
						for (const key in data.topartists.artist) {
							if (Object.prototype.hasOwnProperty.call(key, '0')) {
								artistString += data.topartists.artist[key].name + '\n';
							}
						}

						let titleElement = document.querySelectorAll('#filter_form > table > tbody > tr:nth-child(1) > td:nth-child(2) > input')[0];
						let artistElement = document.querySelectorAll('#filter_form > table > tbody > tr:nth-child(3) > td:nth-child(2) > textarea')[0];
						if (window.location.host === 'orpheus.network') {
							titleElement = document.querySelectorAll('#notification1 > table > tbody > tr:nth-child(1) > td:nth-child(2) > input')[0];
							artistElement = document.querySelectorAll('#notification1 > table > tbody > tr:nth-child(3) > td:nth-child(2) > textarea')[0];
						}

						titleElement.value = 'Top ' + options.limit + ' Last.FM Artists (' + options.period + ')';
						artistElement.textContent = artistString;
					} else {
						GM.notification({
							text: response.statusText,
							title: 'Error: Response Status (' + response.status + ')',
							timeout: 6000,
						});
					}
				},
			});
		} else {
			GM.notification({
				text: 'Please fill out all fields',
				title: 'Error:',
				timeout: 6000,
			});
		}
	}

	function getLovedArtists(options) {
		if (options.userName && options.apiKey && options.limit) {
			const artistArray = [];
			GM.xmlHttpRequest({
				method: 'GET',
				url: 'https://ws.audioscrobbler.com/2.0/?method=user.getlovedtracks&user=' + options.userName + '&api_key=' + options.apiKey + '&limit=' + options.limit + '&format=json',
				onload(response) {
					if (response.status === 200) {
						const data = JSON.parse(response.responseText);
						for (const key in data.lovedtracks.track) {
							if (Object.prototype.hasOwnProperty.call(key, '0') && !artistArray.includes(data.lovedtracks.track[key].artist.name)) {
								artistArray.push(data.lovedtracks.track[key].artist.name);
							}
						}

						let titleElement = document.querySelectorAll('#filter_form > table > tbody > tr:nth-child(1) > td:nth-child(2) > input')[0];
						let artistElement = document.querySelectorAll('#filter_form > table > tbody > tr:nth-child(3) > td:nth-child(2) > textarea')[0];
						if (window.location.host === 'orpheus.network') {
							titleElement = document.querySelectorAll('#notification1 > table > tbody > tr:nth-child(1) > td:nth-child(2) > input')[0];
							artistElement = document.querySelectorAll('#notification1 > table > tbody > tr:nth-child(3) > td:nth-child(2) > textarea')[0];
						}

						let limit = options.limit;
						if (artistArray.length < options.limit) {
							limit = artistArray.length;
						}

						titleElement.value = 'Top ' + limit + ' Last.FM artists based on loved tracks';
						artistElement.textContent = artistArray.join(',');
					} else {
						GM.notification({
							text: response.statusText,
							title: 'Error: Response Status (' + response.status + ')',
							timeout: 6000,
						});
					}
				},
			});
		} else {
			const notificationDetails = {
				text: 'Please fill out all fields',
				title: 'Error:',
				timeout: 6000,
			};
			GM.notification(notificationDetails);
		}
	}

	async function createOptionsForm() {
		let element = document.querySelector('#filter_form');
		if (window.location.host === 'orpheus.network') {
			element = document.querySelector('#notification1');
		}

		const viewToggle = await GM.getValue('viewToggle', false);
		element.insertAdjacentHTML('beforebegin', '<div class="head"><strong>Last.FM Settings</strong><span style="float: right;"><a href="#" id="sc_gln_showhide" onclick="$(\'#sc_gln_settings\').gtoggle(); this.innerHTML = (this.innerHTML == \'Show\' ? \'Hide\' : \'Show\'); return false;" class="brackets">Hide</a></span></div><table cellpadding="6" cellspacing="1" border="0" width="100%" class="layout border user_options" id="sc_gln_settings"><tbody><tr id="sc_gln_mode_tr"><td class="label tooltip" title="Mode"><strong>Mode</strong></td><td><select name="sc_gln_mode" id="sc_gln_mode"><option value="artists">Artists</option><option value="loved">Loved Tracks</option></select></td></tr><tr id="sc_gln_username_tr"><td class="label tooltip" title="Last.FM username"><strong>Last.FM username</strong></td><td><input type="text" size="40" name="sc_gln_username" id="sc_gln_username" value></td></tr><tr id="sc_gln_apikey_tr"><td class="label tooltip" title="Last.FM API Key"><strong>Last.FM API Key (Get one <a href=\'http://www.last.fm/api/account/create\' target=\'_blank\'>here</a>)</strong></td><td><input type="text" size="40" name="sc_gln_apikey" id="sc_gln_apikey" value></td></tr><tr id="sc_gln_period_tr"><td class="label tooltip" title="Top artists over timespan"><strong>Period</strong></td><td><select name="sc_gln_period" id="sc_gln_period"><option value="overall">Overall</option><option value="7day">7 Days</option><option value="1month">1 Month</option><option value="3month">3 Months</option><option value="6month">6 Months</option><option value="12month">12 Months</option></select></td></tr><tr id="sc_gln_limit_tr"><td class="label tooltip" title="Limit number of Artists"><strong>Number of Artists</strong></td><td><input type="text" size="40" name="sc_gln_limit" id="sc_gln_limit" value></td></tr><tr id="sc_gln_viewtoggle_tr"><td class="label tooltip" title="Hide this options form on page load"><strong>Hide on load</strong></td><td><input type="checkbox" name="sc_gln_viewtoggle" id="sc_gln_viewtoggle"></td></tr><tr><td colspan="2" class="center"><input type="submit" id="sc_gln_submit" value="Save Settings">&nbsp;<input type="submit" id="sc_gln_fetch" value="Fetch"></td></tr></tbody></table><div class="head colhead_dark"></div>');
		const submitButton = document.querySelector('#sc_gln_submit');
		submitButton.addEventListener('click', saveSettings, false);
		const settingsElement = document.querySelector('#sc_gln_settings');
		if (viewToggle === true) {
			document.querySelector('#sc_gln_showhide').textContent = 'Show';
			settingsElement.className += ' hidden';
		}
	}

	function getSettings() {
		const userName = document.querySelector('#sc_gln_username').value;
		const apiKey = document.querySelector('#sc_gln_apikey').value;
		const period = document.querySelector('#sc_gln_period').value;
		const limit = document.querySelector('#sc_gln_limit').value;
		return {
			userName,
			apiKey,
			period,
			limit,
		};
	}

	async function loadSettings() {
		const modeValue = await GM.getValue('mode', 'artists');
		const peroidValue = await GM.getValue('period', 'overall');
		selectItemByValue(document.querySelector('#sc_gln_mode'), modeValue);
		document.querySelector('#sc_gln_username').value = await GM.getValue('userName', '');
		document.querySelector('#sc_gln_apikey').value = await GM.getValue('apiKey', '');
		selectItemByValue(document.querySelector('#sc_gln_period'), peroidValue);
		document.querySelector('#sc_gln_viewtoggle').checked = await GM.getValue('viewToggle', false);
		document.querySelector('#sc_gln_limit').value = await GM.getValue('limit', '50');
	}

	async function saveSettings() {
		const mode = document.querySelector('#sc_gln_mode').value;
		const userName = document.querySelector('#sc_gln_username').value;
		const apiKey = document.querySelector('#sc_gln_apikey').value;
		const period = document.querySelector('#sc_gln_period').value;
		const limit = document.querySelector('#sc_gln_limit').value;
		const viewToggle = document.querySelector('#sc_gln_viewtoggle').checked;
		await GM.setValue('mode', mode);
		await GM.setValue('userName', userName);
		await GM.setValue('apiKey', apiKey);
		await GM.setValue('period', period);
		await GM.setValue('limit', limit);
		await GM.setValue('viewToggle', viewToggle);
		GM.notification({
			text: 'Settings saved!',
			title: 'Success:',
			timeout: 6000,
		});
	}

	function selectItemByValue(element, value) {
		for (let i = 0; i < element.options.length; i++) {
			if (element.options[i].value === value) {
				element.selectedIndex = i;
				return true;
			}
		}

		return false;
	}
})();
