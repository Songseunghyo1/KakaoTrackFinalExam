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