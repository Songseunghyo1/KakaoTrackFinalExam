/* FileSaver.js
 * A saveAs() FileSaver implementation.
 * 1.3.2
 * 2016-06-16 18:25:19
 *
 * By Eli Grey, http://eligrey.com
 * License: MIT
 *   See https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md
 */

/*global self */
/*jslint bitwise: true, indent: 4, laxbreak: true, laxcomma: true, smarttabs: true, plusplus: true */

/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */

var saveAs = saveAs || (function(view) {
	"use strict";
	// IE <10 is explicitly unsupported
	if (typeof view === "undefined" || typeof navigator !== "undefined" && /MSIE [1-9]\./.test(navigator.userAgent)) {
		return;
	}
	var
		  doc = view.document
		  // only get URL when necessary in case Blob.js hasn't overridden it yet
		, get_URL = function() {
			return view.URL || view.webkitURL || view;
		}
		, save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a")
		, can_use_save_link = "download" in save_link
		, click = function(node) {
			var event = new MouseEvent("click");
			node.dispatchEvent(event);
		}
		, is_safari = /constructor/i.test(view.HTMLElement) || view.safari
		, is_chrome_ios =/CriOS\/[\d]+/.test(navigator.userAgent)
		, throw_outside = function(ex) {
			(view.setImmediate || view.setTimeout)(function() {
				throw ex;
			}, 0);
		}
		, force_saveable_type = "application/octet-stream"
		// the Blob API is fundamentally broken as there is no "downloadfinished" event to subscribe to
		, arbitrary_revoke_timeout = 1000 * 40 // in ms
		, revoke = function(file) {
			var revoker = function() {
				if (typeof file === "string") { // file is an object URL
					get_URL().revokeObjectURL(file);
				} else { // file is a File
					file.remove();
				}
			};
			setTimeout(revoker, arbitrary_revoke_timeout);
		}
		, dispatch = function(filesaver, event_types, event) {
			event_types = [].concat(event_types);
			var i = event_types.length;
			while (i--) {
				var listener = filesaver["on" + event_types[i]];
				if (typeof listener === "function") {
					try {
						listener.call(filesaver, event || filesaver);
					} catch (ex) {
						throw_outside(ex);
					}
				}
			}
		}
		, auto_bom = function(blob) {
			// prepend BOM for UTF-8 XML and text/* types (including HTML)
			// note: your browser will automatically convert UTF-16 U+FEFF to EF BB BF
			if (/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
				return new Blob([String.fromCharCode(0xFEFF), blob], {type: blob.type});
			}
			return blob;
		}
		, FileSaver = function(blob, name, no_auto_bom) {
			if (!no_auto_bom) {
				blob = auto_bom(blob);
			}
			// First try a.download, then web filesystem, then object URLs
			var
				  filesaver = this
				, type = blob.type
				, force = type === force_saveable_type
				, object_url
				, dispatch_all = function() {
					dispatch(filesaver, "writestart progress write writeend".split(" "));
				}
				// on any filesys errors revert to saving with object URLs
				, fs_error = function() {
					if ((is_chrome_ios || (force && is_safari)) && view.FileReader) {
						// Safari doesn't allow downloading of blob urls
						var reader = new FileReader();
						reader.onloadend = function() {
							var url = is_chrome_ios ? reader.result : reader.result.replace(/^data:[^;]*;/, 'data:attachment/file;');
							var popup = view.open(url, '_blank');
							if(!popup) view.location.href = url;
							url=undefined; // release reference before dispatching
							filesaver.readyState = filesaver.DONE;
							dispatch_all();
						};
						reader.readAsDataURL(blob);
						filesaver.readyState = filesaver.INIT;
						return;
					}
					// don't create more object URLs than needed
					if (!object_url) {
						object_url = get_URL().createObjectURL(blob);
					}
					if (force) {
						view.location.href = object_url;
					} else {
						var opened = view.open(object_url, "_blank");
						if (!opened) {
							// Apple does not allow window.open, see https://developer.apple.com/library/safari/documentation/Tools/Conceptual/SafariExtensionGuide/WorkingwithWindowsandTabs/WorkingwithWindowsandTabs.html
							view.location.href = object_url;
						}
					}
					filesaver.readyState = filesaver.DONE;
					dispatch_all();
					revoke(object_url);
				}
			;
			filesaver.readyState = filesaver.INIT;

			if (can_use_save_link) {
				object_url = get_URL().createObjectURL(blob);
				setTimeout(function() {
					save_link.href = object_url;
					save_link.download = name;
					click(save_link);
					dispatch_all();
					revoke(object_url);
					filesaver.readyState = filesaver.DONE;
				});
				return;
			}

			fs_error();
		}
		, FS_proto = FileSaver.prototype
		, saveAs = function(blob, name, no_auto_bom) {
			return new FileSaver(blob, name || blob.name || "download", no_auto_bom);
		}
	;
	// IE 10+ (native saveAs)
	if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) {
		return function(blob, name, no_auto_bom) {
			name = name || blob.name || "download";

			if (!no_auto_bom) {
				blob = auto_bom(blob);
			}
			return navigator.msSaveOrOpenBlob(blob, name);
		};
	}

	FS_proto.abort = function(){};
	FS_proto.readyState = FS_proto.INIT = 0;
	FS_proto.WRITING = 1;
	FS_proto.DONE = 2;

	FS_proto.error =
	FS_proto.onwritestart =
	FS_proto.onprogress =
	FS_proto.onwrite =
	FS_proto.onabort =
	FS_proto.onerror =
	FS_proto.onwriteend =
		null;

	return saveAs;
}(
	   typeof self !== "undefined" && self
	|| typeof window !== "undefined" && window
	|| this.content
));
// `self` is undefined in Firefox for Android content script context
// while `this` is nsIContentFrameMessageManager
// with an attribute `content` that corresponds to the window

if (typeof module !== "undefined" && module.exports) {
  module.exports.saveAs = saveAs;
} else if ((typeof define !== "undefined" && define !== null) && (define.amd !== null)) {
  define("FileSaver.js", function() {
    return saveAs;
  });
}

console.log('my-note app.js');

var btn_newNote = document.getElementById('btn_newNote');   //새노트 버튼
var btn_saveNote = document.getElementById('btn_saveNote'); //노트저장 버튼
var btn_download = document.getElementById('btn_download'); //노트 다운로드 버튼
var btn_fullScreen = document.getElementById('btn_fullscreen'); //전체화면 버튼
var btn_about = document.getElementById('btn_about');           //about 버튼

var textArea = document.getElementById('memo');             //index.html의 <textarea>

var noteTitle = '';
var listNote = '';
/**
* 새노트 버튼에 대한 함수
* 새노트 버튼이 눌리면 index.html 파일의 <textarea></textarea> 내용 클리어
* 텍스트를 입력받지 않은 상태에서는 placeholder '내용을 입력하세요'는 남아있어야 함
*/
btn_newNote.onclick = function clickNewNote() {
    // button이 눌릴 때 마다 문제없이 작동하는지 확인하기 위한 메세지
    console.log('New Note Button Clicked');
    textArea.value = '';
}

/**
 * 노트 저장에 대한 함수
 * 노트저장 버튼이 눌리면 localStorage에 textarea내용 저장
*/
btn_saveNote.onclick = function () {
    // button이 눌릴 때 마다 문제없이 작동하는지 확인하기 위한 메세지
    console.log('Save Note Button Clicked');

    // TODO local storage에 저장하는 부분 구현
    var str;
    console.log(textArea.value);
    str = textArea.value;
    localStorage.setItem("1", str);
}

/**
 * 홈페이지 최초 진입 시 localStorage에 저장된 내용이 있을 경우
 * 화면에 표시
 */
document.body.onload = function (){
    var str;
    console.log('Onload');
    str = localStorage.getItem("1");
    textArea.value = str;
}

/**
 * 노트 다운로드 버튼 클릭 시
 * 노트를 다운받는 기능제공 메소드
 * textarea의 값을 다운로드
 */
btn_download.onclick = function () {
    console.log('Download Button Clicked!');
    var blob = new Blob([textArea.value], {type: "text/plain;charset=utf-8"});
    saveAs(blob, "MyNote.txt");
}

/**
 * 전체화면 버튼 클릭시
 * 화면을 전체화면으로 전환
 * 한번 더 누르면 원래 화면으로 전환
 * */
btn_fullScreen.onclick = function () {
    var docElm = document.documentElement;

    if (docElm.requestFullscreen) {
        console.log('full screen1');
        docElm.requestFullscreen();
    }
    else if (docElm.mozRequestFullScreen) {
        console.log('full screen2');
        docElm.mozRequestFullScreen();
    }
    else if (docElm.webkitRequestFullScreen) {
        console.log('full screen3');
        docElm.webkitRequestFullScreen();
    }
    else if (docElm.msRequestFullscreen) {
        console.log('full screen4');
        docElm.msRequestFullscreen();
    }
}

/**
 * about 버튼 클릭시
 * 화면 가운데(center)에 레이어(div)를 이용하여
 * application 정보 표시*/
btn_about.onclick = function () {
    console.log('About Button Clicked!');
    setNoteInfo();
}

function setNoteInfo() {
    document.getElementById('title').innerHTML = '<h1>My Note</h1>' +
        '<div class="list" id="list">' +  '<h3>노트 작성 방법</h3>' +
            '<ul>'+
                '<li>TextArea에 메모를 입력한다.</li>' +
                '<li>초기화 시키고 싶을 경우 새노트 버튼을 클릭한다.</li>' +
                '<li>노트저장 버튼을 클릭하면 사용자가 입력한 내용을 저장한다.</li>' +
                '<li>노트다운로드 버튼을 누르며면 현재 입력된 메모가 다운로드된다.</li>' +
                '<li>전체화면 버튼을 누르면 전체화면 모드로 전환된다.</li>' +
                '<li>about 버튼을 누르면 도움말을 출력한다.</li>' +
                '</ul>' +
        '</div>';
}