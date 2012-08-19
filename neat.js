(function(window) {
	var document = window.document;
	var chrome = window.chrome;
	var localStorage = window.localStorage;
	var navigator = window.navigator;
	var body = document.body;
	var _m = chrome.i18n.getMessage;
	
	function StringList () {
		this._strings_ = new Array();
	};

	StringList.prototype.append = function(str) {
		var inputstr = "" + str;
		if (inputstr) {
			this._strings_.push(inputstr);
			//console.log('StringList.prototype.append, inputstr = "' + inputstr + '"');
		}
	};
	
	StringList.prototype.remove = function(str) {
		var inputstr = "" + str;
		if (inputstr) {
			for ( var i = 0; i < this._strings_.length; i++) {
				if	(this._strings_[i] == inputstr) {
					this._strings_.splice(i, 1);
					//console.log('StringList.prototype.remove, inputstr = "' + inputstr + '", this._strings_[i] = "' + this._strings_[i] + '"');
					break;
				}
			}
		}
	};
	
	StringList.prototype.replace = function(strold, strnew) {
		var inputstr = "" + strold;
		var newstr = "" + strnew;
		if (inputstr) {
			for ( var i = 0; i < this._strings_.length; i++) {
				if	(this._strings_[i] == inputstr) {
					this._strings_[i] = newstr;
					//console.log('StringList.prototype.replace, inputstr = "' + inputstr + '", this._strings_[i] = "' + this._strings_[i] + '"');
				}
			}
		}
	};
	
	StringList.prototype.fromString = function(str) {
		var inputstr = "" + str;
		if (inputstr) {
			this._strings_ = inputstr.split(",");
			//console.log('StringList.prototype.fromString, inputstr = "' + inputstr + '"');
		}
	};

	StringList.prototype.toString = function() {
		return this._strings_.join(",");
	};
	
	function SeparatorManager () {
		this.stringList = new StringList();
		if (localStorage.separators) {
			this.stringList.fromString(localStorage.separators);
		}
	};
	
	SeparatorManager.prototype.add = function(str) {
		this.stringList.append(str);
		localStorage.separators = this.stringList.toString();
	};
	
	SeparatorManager.prototype.update = function(str, strnew) {
		this.stringList.replace(str, strnew);
		localStorage.separators = this.stringList.toString();
	};
	
	SeparatorManager.prototype.remove = function(str) {
		this.stringList.remove(str);
		localStorage.separators = this.stringList.toString();
	};
	
	SeparatorManager.prototype.getAll = function(str) {
		return this.stringList._strings_;
	};
	
	separatorManager = new SeparatorManager();
	
	//regex for color expressions
	var hexcolorreg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
	//RGB -> HEX
	String.prototype.colorHex = function(){
		var that = this;
		if(/^(rgb|RGB)/.test(that)){
			var aColor = that.replace(/(?:\(|\)|rgb|RGB)*/g,"").split(",");
			var strHex = "#";
			for(var i=0; i<aColor.length; i++){
				var hex = Number(aColor[i]).toString(16);
				if(hex === "0"){
					hex += hex;	
				}
				strHex += hex;
			}
			if(strHex.length !== 7){
				strHex = that;	
			}
			return strHex;
		}else if(hexcolorreg.test(that)){
			var aNum = that.replace(/#/,"").split("");
			if(aNum.length === 6){
				return that;	
			}else if(aNum.length === 3){
				var numHex = "#";
				for(var i=0; i<aNum.length; i+=1){
					numHex += (aNum[i]+aNum[i]);
				}
				return numHex;
			}
		}else{
			return '';	
		}
	};

	//HEX -> RGB
	String.prototype.colorRgb = function(){
		var sColor = this.toLowerCase();
		if(sColor && hexcolorreg.test(sColor)){
			if(sColor.length === 4){
				var sColorNew = "#";
				for(var i=1; i<4; i+=1){
					sColorNew += sColor.slice(i,i+1).concat(sColor.slice(i,i+1));	
				}
				sColor = sColorNew;
			}
			//6 bit
			var sColorChange = [];
			for(var i=1; i<7; i+=2){
				sColorChange.push(parseInt("0x"+sColor.slice(i,i+2)));	
			}
			return "RGB(" + sColorChange.join(",") + ")";
		}else{
			return '';	
		}
	};

	// ++++++++ added by windviki@gmail.com ++++++++
	copy_to_clipboard = function(copyText) {
		if (window.clipboardData) {
			window.clipboardData.setData("Text", copyText);
		} else {
			$('copier-input').value = copyText;
			$('copier-input').select();
			document.execCommand("Copy");
		}
	};

	// class for get tree style text
	function TreeText(nodeid) {
		this.id = nodeid;
		this.text = '';
		this.level = 0;
	};
	

	TreeText.prototype.get = function(fn) {
		var _self1 = this;
		var _fn1 = fn;
		chrome.bookmarks.get(_self1.id, function(nodeList) {
			if (!nodeList.length)
				return;
			var node = nodeList[0];
			var url = node.url;
			var title = node.title;
			// check whether the referenced node is bookmark or folder
			var isBookmark = !!url;
			_self1.text += _self1.level ? '\t' * _self1.level : '' + title + '\r\n';
			if (isBookmark) {
				_self1.text += _self1.level ? '\t' * _self1.level : '' + url;
				if (_fn1)
					_fn1(_self1.text);
			} else {
				/*
				 * var _self2 = _self1; var _fn2 = _fn1; chrome.bookmarks.getChildren(_self2.id, function(nodechildren) {
				 * for ( var i = 0, l = nodechildren.length; i < l; i++) { var d = nodechildren[i]; var child = new
				 * TreeText(d.id); child.level = _self2.level + 1; var _self3 = _self2; child.get(function(childtext){
				 * _self3.text += childtext; _self3.text += '\r\n'; console.info("child get end. id = " + _self3.id + ",
				 * text = " + _self3.text); }); } console.info("get2 end. id = " + _self2.id + ", text = " +
				 * _self2.text); if(_fn2) _fn2(_self2.text); });
				 */
			}
		});
	};

	// ++++++++ end ++++++++

	// Error alert
	var AlertDialog = {
		open : function(dialog) {
			if (!dialog)
				return;
			$('alert-dialog-text').innerHTML = dialog;
			body.addClass('needAlert');
		},
		close : function() {
			body.removeClass('needAlert');
		}
	};
	window.addEventListener('error', function() {
		AlertDialog.open('<strong>' + _m('errorOccured') + '</strong><br>' + _m('reportedToDeveloper'));
	}, false);

	// Platform detection
	var os = (navigator.platform.toLowerCase().match(/mac|win|linux/i) || [ 'other' ])[0];
	body.addClass(os);

	// Chrome version detection
	var version = (function() {
		var v = {};
		var keys = [ 'major', 'minor', 'build', 'patch' ];
		var matches = navigator.userAgent.match(/chrome\/([\d]+)\.([\d]+)\.([\d]+)\.([\d]+)/i);
		if (!matches)
			return null;
		matches.slice(1).forEach(function(m, i) {
			v[keys[i]] = m.toInt();
		});
		return v;
	})();
	
	// Fix scrollbar bug in Chrome 19+
	if (version.major >= 19) {
		document.getElementById('container').style.display = "";
	}
	else {
		document.getElementById('container').style.display = "-webkit-box";
	}
	
	// Some i18n
	$('search-input').placeholder = _m('searchBookmarks');
	$('edit-dialog-name').placeholder = _m('name');
	$('edit-dialog-url').placeholder = _m('url');
	$('new-folder-dialog-name').placeholder = _m('name');
	$each({
		'bookmark-new-tab' : 'openNewTab',
		'bookmark-new-window' : 'openNewWindow',
		'bookmark-new-incognito-window' : 'openIncognitoWindow',
		'bookmark-edit' : 'edit',
		'bookmark-delete' : 'delete',
		'add-bookmark-top' : 'addBookmarkTop',
		'add-bookmark-bottom' : 'addBookmarkBottom',
		'add-bookmark-before-bookmark' : 'addBookmarkBefore',
		'add-bookmark-after-bookmark' : 'addBookmarkAfter',
		'add-folder-before-bookmark' : 'addNewFolderBefore',
		'add-folder-after-bookmark' : 'addNewFolderAfter',
		'add-bookmark-before-folder' : 'addBookmarkBefore',
		'add-bookmark-after-folder' : 'addBookmarkAfter',
		'add-folder-before-folder' : 'addNewFolderBefore',
		'add-folder-after-folder' : 'addNewFolderAfter',
		'add-new-folder' : 'addNewFolder',
		'add-separator' : 'addSeparator',
		'remove-separator' : 'removeSeparator',
		'add-folder-separator' : 'addSeparator',
		'copy-title-and-url' : 'copyTitleAndUrl',
		// 'copy-all-titles-and-urls' : 'copyAllTitlesAndUrls',
		'replace-url' : 'replaceUrl',
		'folder-window' : 'openBookmarks',
		'folder-new-window' : 'openBookmarksNewWindow',
		'folder-new-incognito-window' : 'openBookmarksIncognitoWindow',
		'folder-edit' : 'edit',
		'folder-delete' : 'deleteEllipsis',
		'edit-dialog-button' : 'save',
		'new-folder-dialog-button' : 'save'
	}, function(msg, id) {
		var el = $(id), m = _m(msg);
		if (el.tagName == 'COMMAND')
			el.label = m;
		el.textContent = m;
	});

	// RTL indicator
	var rtl = (body.getComputedStyle('direction') == 'rtl');
	if (rtl)
		body.addClass('rtl');

	// Init some variables
	var opens = localStorage.opens ? JSON.parse(localStorage.opens) : [];
	var rememberState = !localStorage.dontRememberState;
	var httpsPattern = /^https?:\/\//i;
	var onlyShowBMBar = !!localStorage.onlyShowBMBar;

	// Adaptive bookmark tooltips
	var adaptBookmarkTooltips = function() {
		var bookmarks = document.querySelectorAll('li.child a');
		for ( var i = 0, l = bookmarks.length; i < l; i++) {
			var bookmark = bookmarks[i];
			if (bookmark.hasClass('titled')) {
				if (bookmark.scrollWidth <= bookmark.offsetWidth) {
					bookmark.title = bookmark.href;
					bookmark.removeClass('titled');
				}
			} else if (bookmark.scrollWidth > bookmark.offsetWidth) {
				var text = bookmark.querySelector('i').textContent;
				var title = bookmark.title;
				if (text != title) {
					bookmark.title = text + '\n' + title;
					bookmark.addClass('titled');
				}
			}
		}
	};

	var generateBookmarkHTML = function(title, url, extras) {
		if (!extras)
			extras = '';
		var u = url.htmlspecialchars();
		var favicon = 'chrome://favicon/' + u;
		var tooltipURL = url;
		if (/^javascript:/i.test(url)) {
			if (url.length > 140)
				tooltipURL = url.slice(0, 140) + '...';
			favicon = 'document-code.png';
		}
		tooltipURL = tooltipURL.htmlspecialchars();
		var name = title.htmlspecialchars() || (httpsPattern.test(url) ? url.replace(httpsPattern, '') : _m('noTitle'));
		var bookmarkhtml = '<a href="' + u + '"' + ' title="' + tooltipURL 
				+ '" tabindex="0" ' + extras + '>' 
				+ '<img src="' + favicon + '" width="16" height="16" alt=""><i>' 
				+ name + '</i>' + '</a>';
		return bookmarkhtml;
	};

	var generateHTML = function(data, level) {
		if (!level)
			level = 0;
		var paddingStart = 14 * level;
		var group = (level == 0) ? 'tree' : 'group';
		var html = '<ul role="' + group + '" data-level="' + level + '">';

		for ( var i = 0, l = data.length; i < l; i++) {
			var d = data[i];
			var children = d.children;
			var title = d.title.htmlspecialchars();
			var url = d.url;
			var id = d.id;
			var parentID = d.parentId;
			var idHTML = id ? ' id="neat-tree-item-' + id + '"' : '';
			var isFolder = d.dateGroupModified || children || typeof url == 'undefined';
			if (isFolder) {
				var isOpen = false;
				var open = '';
				if (rememberState) {
					isOpen = opens.contains(id);
					if (isOpen)
						open = ' open';
				}
				html += '<li class="parent' + open + '"' + idHTML + '" level="' + level + '" role="treeitem" aria-expanded="' + isOpen
						+ '" data-parentid="' + parentID + '">' + '<span tabindex="0" style="-webkit-padding-start: '
						+ paddingStart + 'px"><b class="twisty"></b>'
						+ '<img src="folder.png" width="16" height="16" alt=""><i>' + (title || _m('noTitle')) + '</i>'
						+ '</span>';
				if (isOpen) {
					if (children) {
						html += generateHTML(children, level + 1);
					} else {
						(function(_id) {
							chrome.bookmarks.getChildren(_id, function(children) {
								var html = generateHTML(children, level + 1);
								var div = document.createElement('div');
								div.innerHTML = html;
								var ul = div.querySelector('ul');
								ul.inject($('neat-tree-item-' + _id));
								div.destroy();
							});
						})(id);
					}
				}
			} else {
				html += '<li class="child"' + idHTML + ' level="' + level + '" role="treeitem" data-parentid="' + parentID + '">'
						+ generateBookmarkHTML(title, url, 'style="-webkit-padding-start: ' + paddingStart + 'px"');
			}
			html += '</li>';
		}
		html += '</ul>';
		return html;
	};

	addSeparator = function(nodeid, where, bsave) {
		chrome.bookmarks.get(nodeid, function(nodeList) {
			if (!nodeList || !nodeList.length) {
				separatorManager.remove(nodeid);
				return;
			}
			var node = nodeList[0];
			var url = node.url;
			// check whether the referenced node is bookmark or folder
			var isBookmark = !!url;

			// get parent node
			var parentid = node.parentId;
			var pnode = $('neat-tree-item-' + parentid);
			var rnode = $('neat-tree-item-' + node.id);
			if(!pnode){
				pnode = document.body;
			}
			if(!rnode){
				//console.log('addSeparator rnode = null!, nodeid = ' + nodeid);
				return;
			}
			//if (where == 'before') {
			//}
			var ul = pnode.querySelector('ul');
			var div = document.createElement('div');
			var lv = rnode.getAttribute('level'); //getAttribute!
			var paddingStart = lv*14;
			var hrwidth = window.innerWidth - paddingStart - 40;
			//console.log('addSeparator. innerWidth = ' + window.innerWidth + ', paddingStart = ' + paddingStart + ', left = ' + rnode.left);
			var color = '#B0B0B0';
			if (localStorage.separatorcolor){
				color = localStorage.separatorcolor.colorHex();
			}
			div.innerHTML = '<li>' 
							//+ '<a href="chrome://chrome/settings/"' 
							+ '<a href="#"' 
							+ ' style="-webkit-padding-start: ' + paddingStart + 'px"' 
							+ '>' 
							+ '<img width="16" height="16" style="display:none;"></img>'
							+ '<hr' 
							+ ' class="child"'
							+ ' role="treeitem"'
							+ ' width="' +  hrwidth + 'px"' 
							//+ ' height="' +  2 + 'px"' 
							+ ' id="creator-' + nodeid + '"' 
							//+ ' align=right color=' + color 
							+ ' align=right'
							//+ ' size=1' 
							//+ ' style="position:absolute;left:' + paddingStart + ';"'
							+ ' style="border:1px dotted ' + color + ';"'
							+ '></a></li>';
			var hr = div.querySelector('li');
			if (rnode.nextSibling) {
				ul.insertBefore(hr, rnode.nextSibling);
			} else {
				ul.appendChild(hr);
			}
			div.destroy();
			if(bsave){
				separatorManager.add(nodeid);
			}
		}); // end bookmarks.get
	};
	
		
	checkSeparator = function (node) {
		if (node && node.nextElementSibling) {
			nextnode = node.nextElementSibling;
			prevnode = node.previousElementSibling;
			hr = nextnode.querySelector('hr');
			if (hr) {
				id = hr.id.replace('creator-', '');
				if (prevnode && !prevnode.querySelector('hr')) {
					newid = prevnode.id.replace('neat-tree-item-', '');
					hr.id = 'creator-' + newid;
					separatorManager.update(id, newid);
				} else {
					//remove separator
					separatorManager.remove(id);
					hr.parentNode.destroy();
				} 
			}
		}
	};
		
	var $tree = $('tree');
	chrome.bookmarks.getTree(function(tree) {
		var html = '';
		if (onlyShowBMBar) {
			html = generateHTML(tree[0].children[0].children);
			// console.log("----- html -----\n"+html+"\n");
		} else {
			html = generateHTML(tree[0].children);
		}

		$tree.innerHTML = html;

		if (rememberState)
			$tree.scrollTop = localStorage.scrollTop ? localStorage.scrollTop : 0;

		var focusID = localStorage.focusID;
		if (typeof focusID != 'undefined' && focusID != null) {
			var focusEl = $('neat-tree-item-' + focusID);
			if (focusEl) {
				var oriOverflow = $tree.style.overflow;
				$tree.style.overflow = 'hidden';
				focusEl.style.width = '100%';
				focusEl.firstElementChild.addClass('focus');
				setTimeout(function() {
					$tree.style.overflow = oriOverflow;
				}, 1);
				setTimeout(function() {
					localStorage.removeItem('focusID');
				}, 4000);
			}
		}

		setTimeout(adaptBookmarkTooltips, 100);
		
		var seps = separatorManager.getAll();
		for(var i=0; i<seps.length; i++) {
			if(seps[i]) {
				//console.log('separatorManager.getAll i = "' + i + '" seps[i] = "' + seps[i] +'"');
				addSeparator(seps[i], 'after', false);
			}
		}

		tree = null;
	});

	// Events for the tree
	$tree.addEventListener('scroll', function() {
		localStorage.scrollTop = $tree.scrollTop;
	});
	$tree.addEventListener('focus', function(e) {
		var el = e.target;
		var tagName = el.tagName;
		var focusEl = $tree.querySelector('.focus');
		if (focusEl)
			focusEl.removeClass('focus');
		if (tagName == 'A' || tagName == 'SPAN') {
			var id = el.parentNode.id.replace('neat-tree-item-', '');
			localStorage.focusID = id;
		} else {
			localStorage.focusID = null;
		}
	}, true);
	var closeUnusedFolders = localStorage.closeUnusedFolders;
	$tree.addEventListener('click', function(e) {
		if (e.button != 0)
			return;
		var el = e.target;
		var tagName = el.tagName;
		if (tagName != 'SPAN')
			return;
		if (e.shiftKey || e.ctrlKey)
			return;
		var parent = el.parentNode;
		parent.toggleClass('open');
		var expanded = parent.hasClass('open');
		parent.setAttribute('aria-expanded', expanded);
		var children = parent.querySelector('ul');
		if (!children) {
			var id = parent.id.replace('neat-tree-item-', '');
			chrome.bookmarks.getChildren(id, function(children) {
				var html = generateHTML(children, parseInt(parent.parentNode.dataset.level) + 1);
				var div = document.createElement('div');
				div.innerHTML = html;
				var ul = div.querySelector('ul');
				ul.inject(parent);
				div.destroy();
				setTimeout(adaptBookmarkTooltips, 100);
			});
		}
		if (closeUnusedFolders && expanded) {
			var siblings = parent.getSiblings('li');
			for ( var i = 0, l = siblings.length; i < l; i++) {
				var li = siblings[i];
				if (li.hasClass('parent')) {
					li.removeClass('open').setAttribute('aria-expanded', false);
				}
			}
		}
		var opens = $tree.querySelectorAll('li.open');
		opens = Array.map(function(li) {
			return li.id.replace('neat-tree-item-', '');
		}, opens);
		localStorage.opens = JSON.stringify(opens);
	});
	// Force middle clicks to trigger the focus event
	$tree.addEventListener('mouseup', function(e) {
		if (e.button != 1)
			return;
		var el = e.target;
		var tagName = el.tagName;
		if (tagName != 'A' && tagName != 'SPAN')
			return;
		el.focus();
	});

	// Search
	var $results = $('results');
	var searchMode = false;
	var searchInput = $('search-input');
	var prevValue = '';

	var search = function() {
		var value = searchInput.value.trim();
		localStorage.searchQuery = value;
		if (value == '') {
			prevValue = '';
			searchMode = false;
			$tree.style.display = 'block';
			$results.style.display = 'none';
			return;
		}
		if (value == prevValue)
			return;
		prevValue = value;
		searchMode = true;
		chrome.bookmarks.search(value, function(results) {
			var v = value.toLowerCase();
			var vPattern = new RegExp('^' + value.escapeRegExp().replace(/\s+/g, '.*'), 'ig');
			if (results.length > 1) {
				results.sort(function(a, b) {
					var aTitle = a.title;
					var bTitle = b.title;
					var aIndexTitle = aTitle.toLowerCase().indexOf(v);
					var bIndexTitle = bTitle.toLowerCase().indexOf(v);
					if (aIndexTitle >= 0 || bIndexTitle >= 0) {
						if (aIndexTitle < 0)
							aIndexTitle = Infinity;
						if (bIndexTitle < 0)
							bIndexTitle = Infinity;
						return aIndexTitle - bIndexTitle;
					}
					var aTestTitle = vPattern.test(aTitle);
					var bTestTitle = vPattern.test(bTitle);
					if (aTestTitle && !bTestTitle)
						return -1;
					if (!aTestTitle && bTestTitle)
						return 1;
					return b.dateAdded - a.dateAdded;
				});
				results = results.slice(0, 100); // 100 is enough
			}
			var html = '<ul role="list">';
			for ( var i = 0, l = results.length; i < l; i++) {
				var result = results[i];
				var id = result.id;
				html += '<li data-parentid="' + result.parentId + '" id="results-item-' + id + '" role="listitem">'
						+ generateBookmarkHTML(result.title, result.url);
			}
			html += '</ul>';
			$tree.style.display = 'none';
			$results.innerHTML = html;
			$results.style.display = 'block';

			var lis = $results.querySelectorAll('li');
			Array.forEach(function(li) {
				var parentId = li.dataset.parentid;
				chrome.bookmarks.get(parentId, function(node) {
					if (!node || !node.length)
						return;
					var a = li.querySelector('a');
					a.title = _m('parentFolder', node[0].title) + '\n' + a.title;
				});
			}, lis);

			results = null;
			vPattern = null;
			lis = null;
		});
	};
	searchInput.addEventListener('input', search);

	searchInput.addEventListener('keydown', function(e) {
		var key = e.keyCode;
		var focusID = localStorage.focusID;
		if (key == 40 && searchInput.value.length == searchInput.selectionEnd) { // down
			e.preventDefault();
			if (searchMode) {
				$results.querySelector('ul>li:first-child a').focus();
			} else {
				$tree.querySelector('ul>li:first-child').querySelector('span, a').focus();
			}
		} else if (key == 13 && searchInput.value.length) { // enter
			var item = $results.querySelector('ul>li:first-child a');
			item.focus();
			setTimeout(function() {
				var event = document.createEvent('MouseEvents');
				event.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
				item.dispatchEvent(event);
			}, 30);
		} else if (key == 9 && !searchMode) { // tab
			if (typeof focusID != 'undefined' && focusID != null) {
				var focusEl = $('neat-tree-item-' + focusID);
				if (focusEl) {
					e.preventDefault();
					focusEl.firstElementChild.focus();
				}
			} else {
				var bound = $tree.scrollTop;
				var items = $tree.querySelectorAll('a, span');
				var firstItem = Array.filter(function(item) {
					return !!item.parentElement.offsetHeight && ((item.offsetTop + item.offsetHeight) > bound);
				}, items)[0];
				if (firstItem)
					firstItem.focus();
			}
			// Pressing esc shouldn't close the popup when search field has value
		} else if (e.keyCode == 27 && searchInput.value) { // esc
			e.preventDefault();
			searchInput.value = '';
			search();
		}
	});

	searchInput.addEventListener('focus', function() {
		body.addClass('searchFocus');
	});
	searchInput.addEventListener('blur', function() {
		body.removeClass('searchFocus');
	});

	// Saved search query
	if (rememberState && localStorage.searchQuery) {
		searchInput.value = localStorage.searchQuery;
		search();
		searchInput.select();
		searchInput.scrollLeft = 0;
	}

	// Popup auto-height
	var resetHeight = function() {
		var zoomLevel = localStorage.zoom ? localStorage.zoom.toInt() / 100 : 1;
		setTimeout(function() {
			var neatTree = $tree.firstElementChild;
			if (neatTree) {
				var fullHeight = (neatTree.offsetHeight + $tree.offsetTop + 16) * zoomLevel;
				var maxHeight = screen.height - window.screenY - 50;
				var height = Math.max(200, Math.min(fullHeight, maxHeight));
				var newheightstyle = height + 'px';
				if (localStorage.popupHeight != height) {
					// Slide up faster than down
					body.style.webkitTransitionDuration = (fullHeight < window.innerHeight) ? '.3s' : '.1s';
					body.style.height = newheightstyle;
					localStorage.popupHeight = height;
				};
			};
		}, 200);
	};
	//if (!searchMode)
	//	resetHeight();

	$tree.addEventListener('click', resetHeight);
	$tree.addEventListener('keyup', resetHeight);

	// Confirm dialog
	ConfirmDialog = {
		open : function(opts) {
			if (!opts)
				return;
			$('confirm-dialog-text').innerHTML = opts.dialog.widont();
			$('confirm-dialog-button-1').innerHTML = opts.button1;
			$('confirm-dialog-button-2').innerHTML = opts.button2;
			if (opts.fn1)
				ConfirmDialog.fn1 = opts.fn1;
			if (opts.fn2)
				ConfirmDialog.fn2 = opts.fn2;
			$('confirm-dialog-button-' + (opts.focusButton || 1)).focus();
			document.body.addClass('needConfirm');
		},
		close : function() {
			document.body.removeClass('needConfirm');
		},
		fn1 : function() {
		},
		fn2 : function() {
		}
	};

	// Edit dialog
	EditDialog = {
		open : function(opts) {
			if (!opts)
				return;
			$('edit-dialog-text').innerHTML = opts.dialog.widont();
			if (opts.fn)
				EditDialog.fn = opts.fn;
			var type = opts.type || 'bookmark';
			var name = $('edit-dialog-name');
			name.value = opts.name;
			name.focus();
			name.select();
			name.scrollLeft = 0; // very delicate, show first few words
			// instead of last
			var url = $('edit-dialog-url');
			if (type == 'bookmark') {
				url.style.display = '';
				url.disabled = false;
				url.value = opts.url;
			} else {
				url.style.display = 'none';
				url.disabled = true;
				url.value = '';
			}
			body.addClass('needEdit');
		},
		close : function() {
			var urlInput = $('edit-dialog-url');
			var url = urlInput.value;
			if (!urlInput.validity.valid) {
				urlInput.value = 'http://' + url;
				if (!urlInput.validity.valid)
					url = ''; // if still invalid, fuck it.
				url = 'http://' + url;
			}
			EditDialog.fn($('edit-dialog-name').value, url);
			body.removeClass('needEdit');
		},
		fn : function() {
		}
	};

	// ++++++++ modified by windviki@gmail.com ++++++++
	// New Folder Dialog
	NewFolderDialog = {
		open : function(optname, optcall) {
			$('new-folder-dialog-text').innerHTML = _m('editFolder');
			if (optcall)
				NewFolderDialog.fn = optcall;
			var name = $('new-folder-dialog-name');
			name.value = optname;
			name.focus();
			name.select();
			name.scrollLeft = 0;
			body.addClass('needInputName');
		},
		close : function() {
			NewFolderDialog.fn($('new-folder-dialog-name').value);
			body.removeClass('needInputName');
		},
		fn : function() {
		}
	};
	// ++++++++ end ++++++++
		
	// Events for dialogs
	$('confirm-dialog-button-1').addEventListener('click', function(e) {
		ConfirmDialog.fn1();
		ConfirmDialog.close();
	});
	$('confirm-dialog-button-2').addEventListener('click', function(e) {
		ConfirmDialog.fn2();
		ConfirmDialog.close();
	});
	$('edit-dialog-form').addEventListener('submit', function(e) {
		EditDialog.close();
		return false;
	});
	$('new-folder-dialog-form').addEventListener('submit', function(e) {
		NewFolderDialog.close();
		return false;
	});
	
	// Bookmark handling
	var dontConfirmOpenFolder = !!localStorage.dontConfirmOpenFolder;
	var bookmarkClickStayOpen = !!localStorage.bookmarkClickStayOpen;
	var openBookmarksLimit = 10;
	var actions = {

		openBookmark : function(url) {
			chrome.tabs.getSelected(null, function(tab) {
				chrome.tabs.update(tab.id, {
					url : decodeURIComponent(url)
				});
				if (!bookmarkClickStayOpen)
					setTimeout(window.close, 200);
			});
		},

		openBookmarkNewTab : function(url, selected, blankTabCheck) {
			var open = function() {
				chrome.tabs.create({
					url : url,
					selected : selected
				});
			};
			if (blankTabCheck) {
				chrome.tabs.getSelected(null, function(tab) {
					if (/^chrome:\/\/newtab/i.test(tab.url)) {
						chrome.tabs.update(tab.id, {
							url : url
						});
						if (!bookmarkClickStayOpen)
							setTimeout(window.close, 200);
					} else {
						open();
					}
				});
			} else {
				open();
			}
		},

		openBookmarkNewWindow : function(url, incognito) {
			chrome.windows.create({
				url : url,
				incognito : incognito
			});
		},

		// ++++++++ added by windviki@gmail.com ++++++++
		addNewBookmarkNode : function(nodeid, where, inurl, intitle) {
			chrome.bookmarks.get(nodeid, function(nodeList) {
				if (!nodeList.length)
					return;
				var node = nodeList[0];
				var url = node.url;
				// check whether the referenced node is bookmark or folder
				var isBookmark = !!url;
				// if the referenced node is folder, check whether it is open
				var isOpenDir = false;
				// check whether the target node is bookmark or folder
				var isAddBookmark = !!inurl;
				var addurl = inurl;
				var addtitle = intitle;

				// get parent node
				var parentid = node.parentId;
				var pnode = $('neat-tree-item-' + parentid);
				var rnode = $('neat-tree-item-' + node.id);
				var iindex = 0;
				if (where == 'before') {
					iindex = node.index;
				}
				if (where == 'after') {
					iindex = node.index + 1;
				}

				// referenced node is folder - 'top', 'bottom', 'before', 'after'
				// referenced node is bookmark - 'before', 'after'
				if (isBookmark) {
					if (where == 'top' || where == 'bottom')
						return;
				} else {
					isOpenDir = (rnode.getAttribute('aria-expanded') == 'true');
				}

				// referenced node is folder
				if (where == 'top') {
					iindex = 0;
					parentid = node.id;
					pnode = $('neat-tree-item-' + parentid);
				}
				if (where == 'bottom') {
					// iindex = node.children.length;
					chrome.bookmarks.getChildren(node.id, function(nodechildren) {
						iindex = nodechildren.length;
					});
					parentid = node.id;
					pnode = $('neat-tree-item-' + parentid);
				}

				if (!pnode) {
					// console.log('null pnode found!!');
				}

				if (isAddBookmark) {// add bookmark
					chrome.bookmarks.create({
						'parentId' : parentid,
						'index' : iindex,
						'title' : addtitle,
						'url' : addurl
					}, function(resultbm) {
						if (!isOpenDir && (where == "top" || where == "bottom")) {
							// console.log('do not add html for closed folder.');
							return;
						}
						var lv = 0;
						if (!pnode) {
							// root
							pnode = document.body;
						} else {
							lv = parseInt(pnode.parentNode.dataset.level) + 1;
						}
						var paddingStart = 14 * lv;
						var idHTML = resultbm.id ? ' id="neat-tree-item-' + resultbm.id + '"' : '';
						var html = '';
						// add bookmark
						html += '<li class="child"'
								+ idHTML
								+ ' level="' + lv + '"'
								+ ' role="treeitem" data-parentid="'
								+ parentid
								+ '">'
								+ generateBookmarkHTML(addtitle, addurl, 'style="-webkit-padding-start: '
										+ paddingStart + 'px"') + '</li>';
						var div = document.createElement('div');
						div.innerHTML = html;
						var li = div.querySelector('li');
						var ul = pnode.querySelector('ul');
						// fix ul
						if (!ul) {
							var tmpdiv = document.createElement('div');
							tmpdiv.innerHTML = '<ul role="group" data-level="' + lv + '"></ul>';
							var newul = tmpdiv.querySelector('ul');
							pnode.appendChild(newul);
							ul = pnode.querySelector('ul');
							tmpdiv.destroy();
						}
						if (where == 'top') {
							if (ul.firstElementChild) {
								ul.insertBefore(li, ul.firstElementChild);
							} else {
								ul.appendChild(li);
							}
						}
						if (where == 'bottom') {
							ul.appendChild(li);
						}
						if (where == 'before') {
							ul.insertBefore(li, rnode);
						}
						if (where == 'after') {
							ul.insertBefore(li, rnode.nextSibling);
						}

						div.destroy();
					});
				} else {// add folder
					NewFolderDialog.open('NewFolder', function(dirtitle) {
						addtitle = dirtitle;
						chrome.bookmarks.create({
							'parentId' : parentid,
							'index' : iindex,
							'title' : addtitle,
							'url' : addurl
						}, function(resultbm) {
							if (!isOpenDir && (where == "top" || where == "bottom")) {
								// console.log('do not add html for closed folder.');
								return;
							}
							var lv = 0;
							if (!pnode) {
								// root
								pnode = document.body;
							} else {
								lv = parseInt(pnode.parentNode.dataset.level) + 1;
							}
							var paddingStart = 14 * lv;
							var idHTML = resultbm.id ? ' id="neat-tree-item-' + resultbm.id + '"' : '';
							var html = '';
							// console.log('innerhtml!!\n'+pnode.innerHTML+'\nname='+pnode.name);
							// add folder
							html += '<li class="parent"' + idHTML
									+ ' level="' + lv + '"'
									+ ' role="treeitem" aria-expanded="false" data-parentid="' + parentid + '">';
							html += '<span tabindex="0" style="-webkit-padding-start: ' + paddingStart
									+ 'px"><b class="twisty"></b>'
									+ '<img src="folder.png" width="16" height="16" alt=""></img><i>'
									+ (addtitle || _m('noTitle')) + '</i>' + '</span>';
							html += '</li>';

							var div = document.createElement('div');
							div.innerHTML = html;
							var li = div.querySelector('li');
							var ul = pnode.querySelector('ul');
							// fix ul
							if (!ul) {
								var tmpdiv = document.createElement('div');
								tmpdiv.innerHTML = '<ul role="group" data-level="' + lv + '"></ul>';
								var newul = tmpdiv.querySelector('ul');
								pnode.appendChild(newul);
								ul = pnode.querySelector('ul');
								tmpdiv.destroy();
							}
							if (where == 'top') {
								if (ul.firstElementChild) {
									ul.insertBefore(li, ul.firstElementChild);
								} else {
									ul.appendChild(li);
								}
							}
							if (where == 'bottom') {
								ul.appendChild(li);
							}
							if (where == 'before') {
								ul.insertBefore(li, rnode);
							}
							if (where == 'after') {
								ul.insertBefore(li, rnode.nextSibling);
							}

							div.destroy();
						}); // end bookmarks.create
					}); // end NewFolderDialog.open
				} // end if
			}); // end bookmarks.get
		},

		copyAllTitlesAndUrls : function(nodeid) {
			var tt = new TreeText(nodeid);
			tt.get(function(textresult) {
				copy_to_clipboard(textresult);
			});
		},

		replaceUrl : function(nodeid, newurl) {
			chrome.bookmarks.get(nodeid, function(nodeList) {
				if (!nodeList.length)
					return;
				var node = nodeList[0];
				// ensure it is a bookmark
				if (!!node.url && !!newurl) {
					chrome.bookmarks.update(node.id, {
						url : newurl
					});
				}
			});
		},
		// ++++++++ end ++++++++

		openBookmarks : function(urls, selected) {
			var urlsLen = urls.length;
			var open = function() {
				chrome.tabs.create({
					url : urls.shift(),
					selected : selected
				// first tab will be selected
				});
				for ( var i = 0, l = urls.length; i < l; i++) {
					chrome.tabs.create({
						url : urls[i],
						selected : false
					});
				}
			};
			if (!dontConfirmOpenFolder && urlsLen > openBookmarksLimit) {
				ConfirmDialog.open({
					dialog : _m('confirmOpenBookmarks', '' + urlsLen),
					button1 : '<strong>' + _m('open') + '</strong>',
					button2 : _m('nope'),
					fn1 : open
				});
			} else {
				open();
			}
		},

		openBookmarksNewWindow : function(urls, incognito) {
			var urlsLen = urls.length;
			var open = function() {
				chrome.windows.create({
					url : urls,
					incognito : incognito
				});
			};
			if (!dontConfirmOpenFolder && urlsLen > openBookmarksLimit) {
				var dialog = incognito ? _m('confirmOpenBookmarksNewIncognitoWindow', '' + urlsLen) : _m(
						'confirmOpenBookmarksNewWindow', '' + urlsLen);
				ConfirmDialog.open({
					dialog : dialog,
					button1 : '<strong>' + _m('open') + '</strong>',
					button2 : _m('nope'),
					fn1 : open
				});
			} else {
				open();
			}
		},

		editBookmarkFolder : function(id) {
			chrome.bookmarks.get(id, function(nodeList) {
				if (!nodeList.length)
					return;
				var node = nodeList[0];
				var url = node.url;
				var isBookmark = !!url;
				var type = isBookmark ? 'bookmark' : 'folder';
				var dialog = isBookmark ? _m('editBookmark') : _m('editFolder');
				EditDialog.open({
					dialog : dialog,
					type : type,
					name : node.title,
					url : decodeURIComponent(url),
					fn : function(name, url) {
						chrome.bookmarks.update(id, {
							title : name,
							url : isBookmark ? url : ''
						},
								function(n) {
									var title = n.title;
									var url = n.url;
									var li = $('neat-tree-item-' + id);
									if (li) {
										if (isBookmark) {
											var css = li.querySelector('a').style.cssText;
											li.innerHTML = generateBookmarkHTML(title, url, 'style="' + css + '"');
										} else {
											var i = li.querySelector('i');
											var name = title
													|| (httpsPattern.test(url)
															? url.replace(httpsPattern, '')
															: _m('noTitle'));
											i.textContent = name;
										}
									}
									if (searchMode) {
										li = $('results-item-' + id);
										li.innerHTML = generateBookmarkHTML(title, url);
									}
									li.firstElementChild.focus();
								});
					}
				});
			});
		},

		deleteBookmark : function(id) {
			var li1 = $('neat-tree-item-' + id);
			var li2 = $('results-item-' + id);
			chrome.bookmarks.remove(id, function() {
				if (li1) {
					var nearLi1 = li1.nextElementSibling || li1.previousElementSibling;
					checkSeparator(li1); // checkSeparator
					li1.destroy();
					if (!searchMode && nearLi1)
						nearLi1.querySelector('a, span').focus();
				}
				if (li2) {
					var nearLi2 = li2.nextElementSibling || li2.previousElementSibling;
					checkSeparator(li2); // checkSeparator
					li2.destroy();
					if (searchMode && nearLi2)
						nearLi2.querySelector('a, span').focus();
				}
			});
		},

		deleteBookmarks : function(id, bookmarkCount, folderCount) {
			var li = $('neat-tree-item-' + id);
			var item = li.querySelector('span');
			if (bookmarkCount || folderCount) {
				var dialog = '';
				var folderName = '<cite>' + item.textContent.trim() + '</cite>';
				if (bookmarkCount && folderCount) {
					dialog = _m('confirmDeleteFolderSubfoldersBookmarks', [ folderName, folderCount, bookmarkCount ]);
				} else if (bookmarkCount) {
					dialog = _m('confirmDeleteFolderBookmarks', [ folderName, bookmarkCount ]);
				} else {
					dialog = _m('confirmDeleteFolderSubfolders', [ folderName, folderCount ]);
				}
				ConfirmDialog.open({
					dialog : dialog,
					button1 : '<strong>' + _m('delete') + '</strong>',
					button2 : _m('nope'),
					fn1 : function() {
						chrome.bookmarks.removeTree(id, function() {
							li.destroy();
						});
						var nearLi = li.nextElementSibling || li.previousElementSibling;
						if (nearLi)
							nearLi.querySelector('a, span').focus();
					},
					fn2 : function() {
						li.querySelector('a, span').focus();
					}
				});
			} else {
				chrome.bookmarks.removeTree(id, function() {
					li.destroy();
				});
				var nearLi = li.nextElementSibling || li.previousElementSibling;
				if (nearLi)
					nearLi.querySelector('a, span').focus();
			}
		}

	};

	var middleClickBgTab = !!localStorage.middleClickBgTab;
	var leftClickNewTab = !!localStorage.leftClickNewTab;
	var noOpenBookmark = false;
	var bookmarkHandler = function(e) {
		e.preventDefault();
		if (e.button != 0)
			return; // force left-click
		if (noOpenBookmark) { // flag that disables opening bookmark
			noOpenBookmark = false;
			return;
		}
		var el = e.target;
		var ctrlMeta = (e.ctrlKey || e.metaKey);
		var shift = e.shiftKey;
		if (el.tagName == 'A' && !el.querySelector('hr')) {
			var url = el.href;
			if (ctrlMeta) { // ctrl/meta click
				actions.openBookmarkNewTab(url, middleClickBgTab ? shift : !shift);
			} else { // click
				if (shift) {
					actions.openBookmarkNewWindow(url);
				} else {
					leftClickNewTab ? actions.openBookmarkNewTab(url, true, true) : actions.openBookmark(url);
				}
			}
		} else if (el.tagName == 'SPAN') {
			var li = el.parentNode;
			var id = li.id.replace('neat-tree-item-', '');
			chrome.bookmarks.getChildren(id, function(children) {
				var urls = Array.map(function(c) {
					return c.url;
				}, children).clean();
				var urlsLen = urls.length;
				if (!urlsLen)
					return;
				if (ctrlMeta) { // ctrl/meta click
					actions.openBookmarks(urls, middleClickBgTab ? shift : !shift);
				} else if (shift) { // shift click
					actions.openBookmarksNewWindow(urls);
				}
			});
		}
	};
	$tree.addEventListener('click', bookmarkHandler);
	$results.addEventListener('click', bookmarkHandler);
	var bookmarkHandlerMiddle = function(e) {
		if (e.button != 1)
			return; // force middle-click
		var event = document.createEvent('MouseEvents');
		event.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, true, false, e.shiftKey, true, 0, null);
		e.target.dispatchEvent(event);
	};
	$tree.addEventListener('mouseup', bookmarkHandlerMiddle);
	$results.addEventListener('mouseup', bookmarkHandlerMiddle);

	// Disable Chrome auto-scroll feature
	window.addEventListener('mousedown', function(e) {
		if (e.button == 1)
			e.preventDefault();
	});

	// Context menu
	var $bookmarkContextMenu = $('bookmark-context-menu');
	var $folderContextMenu = $('folder-context-menu');
	var $separatorContextMenu = $('separator-context-menu');

	var clearMenu = function(e) {
		currentContext = null;
		var active = body.querySelector('.active');
		if (active) {
			active.removeClass('active');
			// This is kinda hacky. Oh well.
			if (e) {
				var el = e.target;
				if (el == $tree || el == $results)
					active.focus();
			}
		}
		$bookmarkContextMenu.style.left = '-999px';
		$bookmarkContextMenu.style.opacity = 0;
		$folderContextMenu.style.left = '-999px';
		$folderContextMenu.style.opacity = 0;
		$separatorContextMenu.style.left = '-999px';
		$separatorContextMenu.style.opacity = 0;
	};

	body.addEventListener('click', clearMenu);
	$tree.addEventListener('scroll', clearMenu);
	$results.addEventListener('scroll', clearMenu);
	$tree.addEventListener('focus', clearMenu, true);
	$results.addEventListener('focus', clearMenu, true);

	var currentContext = null;
	var macCloseContextMenu = false;
	body.addEventListener('contextmenu', function(e) {
		e.preventDefault();
		clearMenu();
		if (os == 'mac') {
			macCloseContextMenu = false;
			setTimeout(function() {
				macCloseContextMenu = true;
			}, 500);
		}
		var el = e.target;
		if (el.tagName == 'A') {
			if	(el.querySelector('hr')) {
				currentContext = el;
				var active = body.querySelector('.active');
				if (active)
					active.removeClass('active');
				el.addClass('active');
				if (el.parentNode.dataset.parentid == '0') {
					$separatorContextMenu.addClass('hide-editables');
				} else {
					$separatorContextMenu.removeClass('hide-editables');
				}
				var separatorMenuWidth = $separatorContextMenu.offsetWidth;
				var separatorMenuHeight = $separatorContextMenu.offsetHeight;
				var pageX = rtl ? Math.max(0, e.pageX - separatorMenuWidth) : Math.min(e.pageX, body.offsetWidth
						- separatorMenuWidth);
				var pageY = e.pageY;
				var boundY = window.innerHeight - separatorMenuHeight;
				if (pageY > boundY)
					pageY -= separatorMenuHeight;
				if (pageY < 0)
					pageY = boundY;
				$separatorContextMenu.style.left = pageX + 'px';
				$separatorContextMenu.style.top = pageY + 'px';
				$separatorContextMenu.style.opacity = 1;
				$separatorContextMenu.focus();
			} else {
				currentContext = el;
				var active = body.querySelector('.active');
				if (active)
					active.removeClass('active');
				el.addClass('active');
				var bookmarkMenuWidth = $bookmarkContextMenu.offsetWidth;
				var bookmarkMenuHeight = $bookmarkContextMenu.offsetHeight;
				var pageX = rtl ? Math.max(0, e.pageX - bookmarkMenuWidth) : Math.min(e.pageX, body.offsetWidth
						- bookmarkMenuWidth);
				var pageY = e.pageY;
				var boundY = window.innerHeight - bookmarkMenuHeight;
				if (pageY > boundY)
					pageY -= bookmarkMenuHeight;
				if (pageY < 0)
					pageY = boundY;
				pageY = Math.max(0, pageY);
				$bookmarkContextMenu.style.left = pageX + 'px';
				$bookmarkContextMenu.style.top = pageY + 'px';
				$bookmarkContextMenu.style.opacity = 1;
				$bookmarkContextMenu.focus();
			}
		} else if (el.tagName == 'SPAN') {
			currentContext = el;
			var active = body.querySelector('.active');
			if (active)
				active.removeClass('active');
			el.addClass('active');
			if (el.parentNode.dataset.parentid == '0') {
				$folderContextMenu.addClass('hide-editables');
			} else {
				$folderContextMenu.removeClass('hide-editables');
			}
			var folderMenuWidth = $folderContextMenu.offsetWidth;
			var folderMenuHeight = $folderContextMenu.offsetHeight;
			var pageX = rtl ? Math.max(0, e.pageX - folderMenuWidth) : Math.min(e.pageX, body.offsetWidth
					- folderMenuWidth);
			var pageY = e.pageY;
			var boundY = window.innerHeight - folderMenuHeight;
			if (pageY > boundY)
				pageY -= folderMenuHeight;
			if (pageY < 0)
				pageY = boundY;
			$folderContextMenu.style.left = pageX + 'px';
			$folderContextMenu.style.top = pageY + 'px';
			$folderContextMenu.style.opacity = 1;
			$folderContextMenu.focus();
		} else if (el.tagName == 'HR') {
			currentContext = el;
			var active = body.querySelector('.active');
			if (active)
				active.removeClass('active');
			el.addClass('active');
			if (el.parentNode.dataset.parentid == '0') {
				$separatorContextMenu.addClass('hide-editables');
			} else {
				$separatorContextMenu.removeClass('hide-editables');
			}
			var separatorMenuWidth = $separatorContextMenu.offsetWidth;
			var separatorMenuHeight = $separatorContextMenu.offsetHeight;
			var pageX = rtl ? Math.max(0, e.pageX - separatorMenuWidth) : Math.min(e.pageX, body.offsetWidth
					- separatorMenuWidth);
			var pageY = e.pageY;
			var boundY = window.innerHeight - separatorMenuHeight;
			if (pageY > boundY)
				pageY -= separatorMenuHeight;
			if (pageY < 0)
				pageY = boundY;
			$separatorContextMenu.style.left = pageX + 'px';
			$separatorContextMenu.style.top = pageY + 'px';
			$separatorContextMenu.style.opacity = 1;
			$separatorContextMenu.focus();
		}
	});
	// on Mac, holding down right-click for a period of time closes the context menu
	// Not a complete implementation, but it works :)
	if (os == 'mac')
		body.addEventListener('mouseup', function(e) {
			if (e.button == 2 && macCloseContextMenu) {
				macCloseContextMenu = false;
				clearMenu();
			}
		});

	var bookmarkContextHandler = function(e) {
		e.stopPropagation();
		if (!currentContext)
			return;
		var el = e.target;
		if (el.tagName != 'COMMAND')
			return;
		var url = currentContext.href;
		var li = currentContext.parentNode;
		var id = li.id.replace(/(neat\-tree|results)\-item\-/, '');
		switch (el.id) {
		// ++++++++ modified by windviki@gmail.com ++++++++
		case 'add-bookmark-before-bookmark':
			chrome.tabs.getSelected(null, function(curTab) {
				actions.addNewBookmarkNode(id, 'before', curTab.url, curTab.title);
			});
			break;
		case 'add-bookmark-after-bookmark':
			chrome.tabs.getSelected(null, function(curTab) {
				actions.addNewBookmarkNode(id, 'after', curTab.url, curTab.title);
			});
			break;
		case 'add-folder-before-bookmark':
			actions.addNewBookmarkNode(id, 'before', '', '');
			break;
		case 'add-folder-after-bookmark':
			actions.addNewBookmarkNode(id, 'after', '', '');
			break;
		case 'add-separator':
			addSeparator(id, 'after', true);
			break;
		case 'copy-title-and-url':
			actions.copyAllTitlesAndUrls(id);
			break;
		case 'replace-url':
			chrome.tabs.getSelected(null, function(curTab) {
				actions.replaceUrl(id, curTab.url);
			});
			break;
		// ++++++++ end ++++++++
		case 'bookmark-new-tab':
			actions.openBookmarkNewTab(url);
			break;
		case 'bookmark-new-window':
			actions.openBookmarkNewWindow(url);
			break;
		case 'bookmark-new-incognito-window':
			actions.openBookmarkNewWindow(url, true);
			break;
		case 'bookmark-edit':
			var li = currentContext.parentNode;
			var id = li.id.replace(/(neat\-tree|results)\-item\-/, '');
			actions.editBookmarkFolder(id);
			break;
		case 'bookmark-delete':
			var li = currentContext.parentNode;
			var id = li.id.replace(/(neat\-tree|results)\-item\-/, '');
			actions.deleteBookmark(id);
			break;
		}
		clearMenu();
	};
	// On Mac, all three mouse clicks work; on Windows, middle-click doesn't work
	$bookmarkContextMenu.addEventListener('mouseup', function(e) {
		e.stopPropagation();
		if (e.button == 0 || (os == 'mac' && e.button == 1))
			bookmarkContextHandler(e);
	});
	$bookmarkContextMenu.addEventListener('contextmenu', bookmarkContextHandler);
	$bookmarkContextMenu.addEventListener('click', function(e) {
		e.stopPropagation();
	});

	var folderContextHandler = function(e) {
		if (!currentContext)
			return;
		var el = e.target;
		if (el.tagName != 'COMMAND')
			return;
		var li = currentContext.parentNode;
		var id = li.id.replace('neat-tree-item-', '');
		chrome.bookmarks.getChildren(id, function(children) {
			var urls = Array.map(function(c) {
				return c.url;
			}, children).clean();
			var urlsLen = urls.length;
			var noURLS = !urlsLen;
			switch (el.id) {
			// ++++++++ modified by windviki@gmail.com ++++++++
			case 'add-bookmark-top':
				chrome.tabs.getSelected(null, function(curTab) {
					actions.addNewBookmarkNode(id, 'top', curTab.url, curTab.title);
				});
				break;
			case 'add-bookmark-bottom':
				chrome.tabs.getSelected(null, function(curTab) {
					actions.addNewBookmarkNode(id, 'bottom', curTab.url, curTab.title);
				});
				break;
			case 'add-bookmark-before-folder':
				chrome.tabs.getSelected(null, function(curTab) {
					actions.addNewBookmarkNode(id, 'before', curTab.url, curTab.title);
				});
				break;
			case 'add-bookmark-after-folder':
				chrome.tabs.getSelected(null, function(curTab) {
					actions.addNewBookmarkNode(id, 'after', curTab.url, curTab.title);
				});
				break;
			case 'add-folder-before-folder':
				actions.addNewBookmarkNode(id, 'before', '', '');
				break;
			case 'add-folder-after-folder':
				actions.addNewBookmarkNode(id, 'after', '', '');
				break;
			case 'add-new-folder':
				actions.addNewBookmarkNode(id, 'top', '', '');
				break;
			case 'add-folder-separator':
				addSeparator(id, 'after', true);
				break;
			case 'copy-all-titles-and-urls':
				actions.copyAllTitlesAndUrls(id);
				break;
			// ++++++++ end ++++++++
			case 'folder-window':
				if (noURLS)
					return;
				actions.openBookmarks(urls);
				break;
			case 'folder-new-window':
				if (noURLS)
					return;
				actions.openBookmarksNewWindow(urls);
				break;
			case 'folder-new-incognito-window':
				if (noURLS)
					return;
				actions.openBookmarksNewWindow(urls, true);
				break;
			case 'folder-edit':
				actions.editBookmarkFolder(id);
				break;
			case 'folder-delete':
				actions.deleteBookmarks(id, urlsLen, children.length - urlsLen);
				break;
			}
		});
		clearMenu();
	};
	$folderContextMenu.addEventListener('mouseup', function(e) {
		e.stopPropagation();
		if (e.button == 0 || (os == 'mac' && e.button == 1))
			folderContextHandler(e);
	});
	$folderContextMenu.addEventListener('contextmenu', folderContextHandler);
	$folderContextMenu.addEventListener('click', function(e) {
		e.stopPropagation();
	});
	
	
	var separatorContextHandler = function(e) {
		if (!currentContext)
			return;
		var el = e.target;
		if (el.tagName != 'COMMAND')
			return;
		var hr = currentContext.querySelector('hr');
		var id = hr.id.replace('creator-', '');
		switch (el.id) {
		case 'remove-separator':
			//console.log('separatorManager.remove creator = "' + id + '"');
			separatorManager.remove(id);
			hr.parentNode.destroy();
			break;
		}
		clearMenu();
	};
	$separatorContextMenu.addEventListener('mouseup', function(e) {
		e.stopPropagation();
		if (e.button == 0 || (os == 'mac' && e.button == 1))
			separatorContextHandler(e);
	});
	$separatorContextMenu.addEventListener('contextmenu', separatorContextHandler);
	//$separatorContextMenu.addEventListener('click', function(e) {
	//	e.stopPropagation();
	//});
	
	// Keyboard navigation
	var keyBuffer = '', keyBufferTimer = null;
	var treeKeyDown = function(e) {
		var item = document.activeElement;
		if (!/^(a|span)$/i.test(item.tagName))
			item = $tree.querySelector('.focus') || $tree.querySelector('li:first-child>span');
		var li = item.parentNode;
		var keyCode = e.keyCode;
		var metaKey = e.metaKey;
		if (keyCode == 40 && metaKey)
			keyCode = 35; // cmd + down (Mac)
		if (keyCode == 38 && metaKey)
			keyCode = 36; // cmd + up (Mac)
		switch (keyCode) {
		case 40: // down
			e.preventDefault();
			var liChild = li.querySelector('ul>li:first-child');
			if (li.hasClass('open') && liChild) {
				liChild.querySelector('a, span').focus();
			} else {
				var nextLi = li.nextElementSibling;
				if (nextLi) {
					nextlispan = nextLi.querySelector('a, span');
					if(nextlispan) {
						nextlispan.focus();
					}
				} else {
					var nextLi = null;
					do {
						li = li.parentNode.parentNode;
						if (li)
							nextLi = li.nextElementSibling;
						if (nextLi)
							nextlispan = nextLi.querySelector('a, span');
							if (nextlispan) //fixed: pushed down "DOWN" when the focus was at the last node
								nextlispan.focus();
					} while (li && !nextLi);
				}
			}
			break;
		case 38: // up
			e.preventDefault();
			var prevLi = li.previousElementSibling;
			if (prevLi) {
				while (prevLi.hasClass('open') && prevLi.querySelector('ul>li:last-child')) {
					var lis = prevLi.querySelectorAll('ul>li:last-child');
					prevLi = Array.filter(function(li) {
						return !!li.parentNode.offsetHeight;
					}, lis).getLast();
				}
				;
				prevLi.querySelector('a, span').focus();
			} else {
				var parentPrevLi = li.parentNode.parentNode;
				if (parentPrevLi && parentPrevLi.tagName == 'LI') {
					parentPrevLi.querySelector('a, span').focus();
				} else {
					searchInput.focus();
				}
			}
			break;
		case 39: // right (left for RTL)
			e.preventDefault();
			if (li.hasClass('parent') && ((!rtl && !li.hasClass('open')) || (rtl && li.hasClass('open')))) {
				var event = document.createEvent('MouseEvents');
				event.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
				li.firstElementChild.dispatchEvent(event);
			} else if (rtl) {
				var parentID = li.dataset.parentid;
				if (parentID == '0')
					return;
				$('neat-tree-item-' + parentID).querySelector('span').focus();
			}
			break;
		case 37: // left (right for RTL)
			e.preventDefault();
			if (li.hasClass('parent') && ((!rtl && li.hasClass('open')) || (rtl && !li.hasClass('open')))) {
				var event = document.createEvent('MouseEvents');
				event.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
				li.firstElementChild.dispatchEvent(event);
			} else if (!rtl) {
				var parentID = li.dataset.parentid;
				if (parentID == '0')
					return;
				// fixed: check whether the parent item exists
				if ($('neat-tree-item-' + parentID))
					$('neat-tree-item-' + parentID).querySelector('span').focus();
			}
			break;
		case 32: // space
		case 13: // enter
			e.preventDefault();
			var event = document.createEvent('MouseEvents');
			event.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, e.ctrlKey, false, e.shiftKey, e.metaKey,
					0, null);
			li.firstElementChild.dispatchEvent(event);
			break;
		case 35: // end
			if (searchMode) {
				this.querySelector('li:last-child a').focus();
			} else {
				var lis = this.querySelectorAll('ul>li:last-child');
				var li = Array.filter(function(li) {
					return !!li.parentNode.offsetHeight;
				}, lis).getLast();
				li.querySelector('span, a').focus();
			}
			break;
		case 36: // home
			if (searchMode) {
				this.querySelector('ul>li:first-child a').focus();
			} else {
				this.querySelector('ul>li:first-child').querySelector('span, a').focus();
			}
			break;
		case 34: // page down
			var self = this;
			var getLastItem = function() {
				var bound = self.offsetHeight + self.scrollTop;
				var items = self.querySelectorAll('a, span');
				return Array.filter(function(item) {
					return !!item.parentElement.offsetHeight && item.offsetTop < bound;
				}, items).getLast();
			};
			var item = getLastItem();
			if (item != document.activeElement) {
				e.preventDefault();
				item.focus();
			} else {
				setTimeout(function() {
					getLastItem().focus();
				}, 0);
			}
			break;
		case 33: // page up
			var self = this;
			var getFirstItem = function() {
				var bound = self.scrollTop;
				var items = self.querySelectorAll('a, span');
				return Array.filter(function(item) {
					return !!item.parentElement.offsetHeight && ((item.offsetTop + item.offsetHeight) > bound);
				}, items)[0];
			};
			var item = getFirstItem();
			if (item != document.activeElement) {
				e.preventDefault();
				item.focus();
			} else {
				setTimeout(function() {
					getFirstItem().focus();
				}, 0);
			}
			break;
		case 113: // F2, not for Mac
			if (os == 'mac')
				break;
			var id = li.id.replace(/(neat\-tree|results)\-item\-/, '');
			actions.editBookmarkFolder(id);
			break;
		case 46: // delete
			break; // don't run 'default'
		default:
			var key = String.fromCharCode(keyCode).trim();
			if (!key)
				return;
			if (key != keyBuffer)
				keyBuffer += key;
			clearTimeout(keyBufferTimer);
			keyBufferTimer = setTimeout(function() {
				keyBuffer = '';
			}, 500);
			var lis = this.querySelectorAll('ul>li');
			var items = [];
			for ( var i = 0, l = lis.length; i < l; i++) {
				var li = lis[i];
				if (li.parentNode.offsetHeight)
					items.push(li.firstElementChild);
			}
			var pattern = new RegExp('^' + keyBuffer.escapeRegExp(), 'i');
			var batch = [];
			var startFind = false;
			var found = false;
			var activeElement = document.activeElement;
			for ( var i = 0, l = items.length; i < l; i++) {
				var item = items[i];
				if (item == activeElement) {
					startFind = true;
				} else if (startFind) {
					if (pattern.test(item.textContent.trim())) {
						found = true;
						item.focus();
						break;
					}
				} else {
					batch.push(item);
				}
			}
			if (!found) {
				for ( var i = 0, l = batch.length; i < l; i++) {
					var item = batch[i];
					if (pattern.test(item.textContent.trim())) {
						item.focus();
						break;
					}
				}
			}
		}
	};
	$tree.addEventListener('keydown', treeKeyDown);
	$results.addEventListener('keydown', treeKeyDown);

	var treeKeyUp = function(e) {
		var item = document.activeElement;
		if (!/^(a|span)$/i.test(item.tagName))
			item = $tree.querySelector('.focus') || $tree.querySelector('li:first-child>span');
		var li = item.parentNode;
		switch (e.keyCode) {
		case 8: // backspace
			if (os != 'mac')
				break; // somehow delete button on mac gives backspace
		case 46: // delete
			e.preventDefault();
			var id = li.id.replace(/(neat\-tree|results)\-item\-/, '');
			if (li.hasClass('parent')) {
				chrome.bookmarks.getChildren(id, function(children) {
					var urlsLen = Array.map(function(c) {
						return c.url;
					}, children).clean().length;
					actions.deleteBookmarks(id, urlsLen, children.length - urlsLen);
				});
			} else {
				actions.deleteBookmark(id);
			}
			break;
		}
	};
	$tree.addEventListener('keyup', treeKeyUp);
	$results.addEventListener('keyup', treeKeyUp);

	var contextKeyDown = function(e) {
		var menu = this;
		var item = document.activeElement;
		var metaKey = e.metaKey;
		switch (e.keyCode) {
		case 40: // down
			e.preventDefault();
			if (metaKey) { // cmd + down (Mac)
				menu.lastElementChild.focus();
			} else {
				if (item.tagName == 'COMMAND') {
					var nextItem = item.nextElementSibling;
					if (nextItem && nextItem.tagName == 'HR')
						nextItem = nextItem.nextElementSibling;
					if (nextItem) {
						nextItem.focus();
					} else if (os != 'mac') {
						menu.firstElementChild.focus();
					}
				} else {
					item.firstElementChild.focus();
				}
			}
			break;
		case 38: // up
			e.preventDefault();
			if (metaKey) { // cmd + up (Mac)
				menu.firstElementChild.focus();
			} else {
				if (item.tagName == 'COMMAND') {
					var prevItem = item.previousElementSibling;
					if (prevItem && prevItem.tagName == 'HR')
						prevItem = prevItem.previousElementSibling;
					if (prevItem) {
						prevItem.focus();
					} else if (os != 'mac') {
						menu.lastElementChild.focus();
					}
				} else {
					item.lastElementChild.focus();
				}
			}
			break;
		case 32: // space
			if (os != 'mac')
				break;
		case 13: // enter
			e.preventDefault();
			var event = document.createEvent('MouseEvents');
			event.initMouseEvent('mouseup', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
			item.dispatchEvent(event);
		case 27: // esc
			e.preventDefault();
			var active = body.querySelector('.active');
			if (active)
				active.removeClass('active').focus();
			clearMenu();
		}
	};
	$bookmarkContextMenu.addEventListener('keydown', contextKeyDown);
	$folderContextMenu.addEventListener('keydown', contextKeyDown);
	//$separatorContextMenu.addEventListener('keydown', contextKeyDown);

	var contextMouseMove = function(e) {
		e.target.focus();
	};
	$bookmarkContextMenu.addEventListener('mousemove', contextMouseMove);
	$folderContextMenu.addEventListener('mousemove', contextMouseMove);
	$separatorContextMenu.addEventListener('mousemove', contextMouseMove);

	var contextMouseOut = function() {
		if (this.style.opacity.toInt())
			this.focus();
	};
	$bookmarkContextMenu.addEventListener('mouseout', contextMouseOut);
	$folderContextMenu.addEventListener('mouseout', contextMouseOut);
	$separatorContextMenu.addEventListener('mouseout', contextMouseOut);

	// Drag and drop, baby
	var draggedBookmark = null;
	var draggedOut = false;
	var canDrop = false;
	var zoomLevel = 1;
	var bookmarkClone = $('bookmark-clone');
	var dropOverlay = $('drop-overlay');
	$tree.addEventListener('mousedown', function(e) {
		if (e.button != 0)
			return;
		var el = e.target;
		var elParent = el.parentNode;
		// can move any bookmarks/folders except the default root folders
		if ((el.tagName == 'A' && elParent.hasClass('child'))
				|| (el.tagName == 'SPAN' && elParent.hasClass('parent') && elParent.dataset.parentid != '0')
				|| (el.tagName == 'A' && el.querySelector('HR'))) {
			e.preventDefault();
			draggedOut = false;
			draggedBookmark = el;
			if (localStorage.zoom)
				zoomLevel = localStorage.zoom.toInt() / 100;
			bookmarkClone.innerHTML = el.innerHTML;
			el.focus();
		}
	});
	var scrollTree = null, scrollTreeInterval = 100, scrollTreeSpot = 10;
	var stopScrollTree = function() {
		clearInterval(scrollTree);
		scrollTree = null;
	};
	document.addEventListener('mousemove', function(e) {
		if (e.button != 0)
			return;
		if (!draggedBookmark)
			return;
		e.preventDefault();
		var el = e.target;
		var clientX = e.clientX;
		var clientY = e.clientY;
		//fixed clientY
		clientY += document.body.scrollTop;
		//hovering over the dragged element itself
		if (el == draggedBookmark) {
			bookmarkClone.style.left = '-999px';
			dropOverlay.style.left = '-999px';
			canDrop = false;
			return;
		}
		draggedOut = true;
		//cursor moves outside the tree
		var treeTop = $tree.offsetTop, treeBottom = window.innerHeight;
		if (clientX < 0 || clientY < treeTop || clientX > $tree.offsetWidth || clientY > treeBottom) {
			bookmarkClone.style.left = '-999px';
			dropOverlay.style.left = '-999px';
			canDrop = false;
		}
		// if hovering over the top or bottom edges of the tree,
		// scroll the tree
		var treeScrollHeight = $tree.scrollHeight, treeOffsetHeight = $tree.offsetHeight;
		if (treeScrollHeight > treeOffsetHeight) { // only scroll when it's scrollable
			var treeScrollTop = $tree.scrollTop;
			if (clientY <= treeTop + scrollTreeSpot) {
				if (treeScrollTop == 0) {
					stopScrollTree();
				} else if (!scrollTree)
					scrollTree = setInterval(function() {
						$tree.scrollByLines(-1);
						dropOverlay.style.left = '-999px';
					}, scrollTreeInterval);
			} else if (clientY >= treeBottom - scrollTreeSpot) {
				if (treeScrollTop == (treeScrollHeight - treeOffsetHeight)) {
					stopScrollTree();
				} else if (!scrollTree)
					scrollTree = setInterval(function() {
						$tree.scrollByLines(1);
						dropOverlay.style.left = '-999px';
					}, scrollTreeInterval);
			} else {
				stopScrollTree();
			}
		}
		// collapse the folder before moving it
		var draggedBookmarkParent = draggedBookmark.parentNode;
		if (draggedBookmark.tagName == 'SPAN' && draggedBookmarkParent.hasClass('open')) {
			draggedBookmarkParent.removeClass('open').setAttribute('aria-expanded', false);
		}
		clientX /= zoomLevel;
		clientY /= zoomLevel;
		if (el.tagName == 'A'/* || el.tagName == 'HR'*/) {
			canDrop = true;
			bookmarkClone.style.top = clientY + 'px';
			bookmarkClone.style.left = (rtl ? (clientX - bookmarkClone.offsetWidth) : clientX) + 'px';
			var elRect = el.getBoundingClientRect();
			//fixed elRectTop
			var elRectTop = elRect.top + document.body.scrollTop;
			//fixed elRectBottom
			var elRectBottom = elRect.bottom + document.body.scrollTop;
			var top = (clientY >= elRectTop + elRect.height / 2) ? elRectBottom : elRectTop;
			dropOverlay.className = 'bookmark';
			dropOverlay.style.top = top + 'px';
			dropOverlay.style.left = rtl ? '0px' : el.style.webkitPaddingStart.toInt() + 16 + 'px';
			dropOverlay.style.width = (el.getComputedStyle('width').toInt() - 12) + 'px';
			dropOverlay.style.height = null;
		} else if (el.tagName == 'SPAN') {
			canDrop = true;
			bookmarkClone.style.top = clientY + 'px';
			bookmarkClone.style.left = clientX + 'px';
			var elRect = el.getBoundingClientRect();
			var top = null;
			//fixed elRectTop
			var elRectTop = elRect.top + document.body.scrollTop;
			//fixed elRectBottom
			var elRectBottom = elRect.bottom + document.body.scrollTop;
			var elRectHeight = elRect.height;
			var elParent = el.parentNode;
			if (elParent.dataset.parentid != '0') {
				if (clientY < elRectTop + elRectHeight * .3) {
					top = elRectTop;
				} else if (clientY > elRectTop + elRectHeight * .7 && !elParent.hasClass('open')) {
					top = elRectBottom;
				}
			}
			if (top == null) {
				dropOverlay.className = 'folder';
				dropOverlay.style.top = elRectTop + 'px';
				dropOverlay.style.left = '0px';
				dropOverlay.style.width = elRect.width + 'px';
				dropOverlay.style.height = elRect.height + 'px';
			} else {
				dropOverlay.className = 'bookmark';
				dropOverlay.style.top = top + 'px';
				dropOverlay.style.left = el.style.webkitPaddingStart.toInt() + 16 + 'px';
				dropOverlay.style.width = (el.getComputedStyle('width').toInt() - 12) + 'px';
				dropOverlay.style.height = null;
			}
		}
		//console.log('dropOverlay top = ' + dropOverlay.style.top + ', scroll = ' + body.scrollTop);
	});
	var onDrop = function() {
		draggedBookmark = null;
		bookmarkClone.style.left = '-999px';
		dropOverlay.style.left = '-999px';
		canDrop = false;
	};
	document.addEventListener('mouseup', function(e) {
		if (e.button != 0)
			return;
		if (!draggedBookmark)
			return;
		stopScrollTree();
		if (!canDrop) {
			if (draggedOut)
				noOpenBookmark = true;
			draggedOut = false;
			onDrop();
			return;
		};
		//el is the target element "A" "SPAN"
		var el = e.target;
		var elParent = el.parentNode;
		//elParent.tagName "LI"
		var id = elParent.id.replace('neat-tree-item-', '');
		if (!id) {
			var hr = elParent.querySelector('hr');
			if (hr) { //dropped taget is separator
				id = hr.id.replace('creator-', '');
			} else {
				onDrop();
				return;
			}
		}
		var draggedBookmarkParent = draggedBookmark.parentNode;
		var draggedID = draggedBookmarkParent.id.replace('neat-tree-item-', '');
		//fixed clientY
		var clientY = (e.clientY + document.body.scrollTop) / zoomLevel;
		if (el.tagName == 'A') { //dropped taget is bookmark
			var elRect = el.getBoundingClientRect();
			//fixed elRectTop
			var elRectTop = elRect.top + document.body.scrollTop;
			var moveBottom = (clientY >= elRectTop + elRect.height / 2);
			chrome.bookmarks.get(id, function(node) {
				if (!node || !node.length)
					return;
				node = node[0];
				var index = node.index;
				var parentId = node.parentId;
				if (draggedID) { //dragged is bookmark
					chrome.bookmarks.move(draggedID, {
						parentId : parentId,
						index : moveBottom ? ++index : index
					}, function() {
						//display
						draggedBookmarkParent.inject(elParent, moveBottom ? 'after' : 'before');
						draggedBookmark.style.webkitPaddingStart = el.style.webkitPaddingStart;
						draggedBookmark.focus();
						onDrop();
					});
				} else { //dragged is separator
					if (!moveBottom) { //before
						var prevli = elParent.previousSibling;
						if (prevli) {
							//previous node
							var newid = prevli.id.replace('neat-tree-item-', '');
							//console.log('move before, newid = ' + newid + ', id = ' + id);
							if (newid) {
								id = newid;
							}
						}
					}
					//display
					draggedBookmarkParent.inject(elParent, moveBottom ? 'after' : 'before');
					draggedBookmark.style.webkitPaddingStart = el.style.webkitPaddingStart;
					//save position
					var hr = draggedBookmark.querySelector('hr');
					var creatorID = hr.id.replace('creator-', '');
					hr.id = 'creator-' + id;
					separatorManager.update(creatorID, id);
					//console.log('target is Bookmark, oldid = ' + creatorID + ', newid = ' + id);
					draggedBookmark.focus();
					onDrop();
				}
			});
		//} else if (el.tagName == 'HR') { //dropped taget is separator
		//	var elRect = el.getBoundingClientRect();
		//	var moveBottom = (clientY >= elRect.top + elRect.height / 2);
		//	draggedBookmarkParent.inject(elParent, moveBottom ? 'after' : 'before');
		//	draggedBookmark.style.webkitPaddingStart = el.style.webkitPaddingStart;
		//	draggedBookmark.focus();
		//	onDrop();
		} else if (el.tagName == 'SPAN') { //dropped taget is directory
			var elRect = el.getBoundingClientRect();
			var move = 0; // 0 = middle, 1 = top, 2 = bottom
			var elRectTop = elRect.top, elRectHeight = elRect.height;
			var elParent = el.parentNode;
			if (elParent.dataset.parentid != '0') {
				if (clientY < elRectTop + elRectHeight * .3) {
					move = 1;
				} else if (clientY > elRectTop + elRectHeight * .7 && !elParent.hasClass('open')) {
					move = 2;
				}
			}
			if (move > 0) { //top or bottom
				var moveBottom = (move == 2);
				chrome.bookmarks.get(id, function(node) {
					if (!node || !node.length)
						return;
					node = node[0];
					var index = node.index;
					var parentId = node.parentId;
					if (draggedID) {
						chrome.bookmarks.move(draggedID, {
							parentId : parentId,
							index : moveBottom ? ++index : index
						}, function() {
							draggedBookmarkParent.inject(elParent, moveBottom ? 'after' : 'before');
							draggedBookmark.style.webkitPaddingStart = el.style.webkitPaddingStart;
							draggedBookmark.focus();
							onDrop();
						});
					} else { //dragged is separator
						if (!moveBottom) { //before
							var prevli = elParent.previousSibling;
							//prevli is dragged element
							if (prevli) {
								//previous node
								var newid = prevli.id.replace('neat-tree-item-', '');
								//console.log('move before, newid = ' + newid + ', id = ' + id);
								if (newid) {
									id = newid;
								}
							}
						}
						draggedBookmarkParent.inject(elParent, moveBottom ? 'after' : 'before');
						draggedBookmark.style.webkitPaddingStart = el.style.webkitPaddingStart;
						//save position
						var hr = draggedBookmark.querySelector('hr');
						var creatorID = hr.id.replace('creator-', '');
						hr.id = 'creator-' + id;
						separatorManager.update(creatorID, id);
						//console.log('target is Folder (top/bottom), oldid = ' + creatorID + ', newid = ' + id);
						draggedBookmark.focus();
						onDrop();
					}
				});
			} else { //middle position
				if (draggedID) {
					chrome.bookmarks.move(draggedID, {
						parentId : id
					}, function() {
						var ul = elParent.querySelector('ul');
						var level = parseInt(elParent.parentNode.dataset.level) + 1;
						draggedBookmark.style.webkitPaddingStart = (14 * level) + 'px';
						if (ul) {
							draggedBookmarkParent.inject(ul);
						} else {
							draggedBookmarkParent.destroy();
						}
						el.focus();
						onDrop();
					});
				} else { //dragged is separator
					var ul = elParent.querySelector('ul');
					var level = parseInt(elParent.parentNode.dataset.level) + 1;
					draggedBookmark.style.webkitPaddingStart = (14 * level) + 'px';
					if (ul) {
						draggedBookmarkParent.inject(ul);
					} else {
						draggedBookmarkParent.destroy();
					}
					el.focus();
					//save position
					var hr = draggedBookmark.querySelector('hr');
					var creatorID = hr.id.replace('creator-', '');
					hr.id = 'creator-' + id;
					separatorManager.update(creatorID, id);
					//console.log('target is Folder, oldid = ' + creatorID + ', newid = ' + id);
					onDrop();
				}
			}
		} else {
			onDrop();
		}
	});

	// Resizer
	var $resizer = $('resizer');
	var resizerDown = false;
	var bodyWidth = 0, screenX = 0;
	// Reset separators
	function resetSeparator(){
		var seps = separatorManager.getAll();
		for(var i=0; i<seps.length; i++) {
			if(seps[i]) {
				//console.log('resetSeparator i = "' + i + '" seps[i] = "' + seps[i] +'"');
				var node = $('creator-' + seps[i]);
				var bmnode = $('neat-tree-item-' + seps[i]);
				var lv = bmnode.getAttribute('level'); //getAttribute!
				var paddingStart = lv*14;
				var hrwidth = window.innerWidth - paddingStart - 40;
				node.width = hrwidth;
			}
		}
	};
	// Drag the edge
	$resizer.addEventListener('mousedown', function(e) {
		e.preventDefault();
		e.stopPropagation();
		resizerDown = true;
		bodyWidth = body.offsetWidth;
		screenX = e.screenX;
	});
	document.addEventListener('mousemove', function(e) {
		if (!resizerDown)
			return;
		e.preventDefault();
		var changedWidth = rtl ? (e.screenX - screenX) : (screenX - e.screenX);
		var width = bodyWidth + changedWidth;
		// 320 < width < 640
		width = Math.min(640, Math.max(320, width));
		body.style.width = width + 'px';
		localStorage.popupWidth = width;
		resetSeparator(); // Reset separators
		clearMenu(); // messes the context menu
	});
	document.addEventListener('mouseup', function(e) {
		if (!resizerDown)
			return;
		e.preventDefault();
		resizerDown = false;
		adaptBookmarkTooltips();
		// record current width
		var changedWidth = rtl ? (e.screenX - screenX) : (screenX - e.screenX);
		var width = bodyWidth + changedWidth;
		//var width = window.innerWidth;
		// 320 < width < 640
		width = Math.min(640, Math.max(320, width));
		body.style.width = width + 'px';
		localStorage.popupWidth = width;
		resetSeparator(); // Reset separators
		clearMenu();
	});
	
	// width will be reset when expanding root folder due to this section of code
	//
	//setTimeout(function() { // delaying execution due to stupid Chrome Linux bug
	//	window.addEventListener('resize', function() {
	//		// in case there's a resizer *outside* the popup page
	//		if (resizerDown)
	//			return;
	//		var width = window.innerWidth;
	//		body.style.width = width + 'px';
	//		localStorage.popupWidth = width;
	//		clearMenu();
	//	});
	//}, 1000);

	// Closing dialogs on escape
	var closeDialogs = function() {
		if (body.hasClass('needConfirm'))
			ConfirmDialog.fn2();
		ConfirmDialog.close();
		if (body.hasClass('needEdit'))
			EditDialog.close();
		if (body.hasClass('needInputName'))
			NewFolderDialog.close();
		if (body.hasClass('needAlert'))
			AlertDialog.close();
	};
	document.addEventListener('keydown', function(e) {
		if (e.keyCode == 27
				&& (body.hasClass('needConfirm') || body.hasClass('needEdit') 
					|| body.hasClass('needAlert') || body.hasClass('needInputName'))) { // esc
			e.preventDefault();
			closeDialogs();
		} else if ((e.metaKey || e.ctrlKey) && e.keyCode == 70) { // cmd/ctrl
			// + f
			searchInput.focus();
			searchInput.select();
		}
	});
	$('cover').addEventListener('click', closeDialogs);

	// Make webkit transitions work only after elements are settled down
	setTimeout(function() {
		body.addClass('transitional');
	}, 10);

	// Zoom
	if (localStorage.zoom) {
		body.dataset.zoom = localStorage.zoom;
	}
	var zoom = function(val) {
		if (draggedBookmark)
			return; // prevent zooming when drag-n-droppping
		//console.log("zoom ---> " + val);
		var dataZoom = body.dataset.zoom;
		var currentZoom = dataZoom ? dataZoom.toInt() : 100;
		if (val == 0) {
			delete body.dataset.zoom;
			localStorage.removeItem('zoom');
		} else {
			var z = (val > 0) ? currentZoom + 10 : currentZoom - 10;
			z = Math.min(150, Math.max(90, z));
			body.dataset.zoom = z;
			localStorage.zoom = z;
		}
		body.addClass('dummy').removeClass('dummy'); // force redraw
		resetHeight();
	};
	document.addEventListener('mousewheel', function(e) {
		if (!e.metaKey && !e.ctrlKey)
			return;
		e.preventDefault();
		zoom(e.wheelDelta);
	});
	document.addEventListener('keydown', function(e) {
		if (!e.metaKey && !e.ctrlKey)
			return;
		switch (e.keyCode) {
		case 187: // + (plus)
			e.preventDefault();
			zoom(1);
			break;
		case 189: // - (minus)
			e.preventDefault();
			zoom(-1);
			break;
		case 48: // 0 (zero)
			e.preventDefault();
			zoom(0);
			break;
		}
	});

	// Fix stupid Chrome build 536 bug
	if (version.build >= 536)
		body.addClass('chrome-536');

	// Fix stupid wrong offset of the page, on Chrome Mac
	if (os == 'mac') {
		setTimeout(function() {
			var top = body.scrollTop;
			if (top != 0)
				body.scrollTop = 0;
		}, 1500);
	}

	if (localStorage.userstyle) {
		var style = document.createElement('style');
		style.textContent = localStorage.userstyle;
		style.inject(document.body);
	}
})(window);