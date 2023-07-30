var board = [];
var rows = 11;
var columns = 7;

var minesCount = 9;
var minesLocation = []; // "2-2", "3-4", "2-1"

var tilesClicked = 0; //goal to click all tiles except the ones containing mines
var flagEnabled = false;
let flag = document.getElementById("flag-button");

var gameOver = false;

window.onload = function() {
    startGame();
}

var sound_empty = new Audio("sounds/empty.mp3");
var sound_wrong = new Audio("sounds/wrong.mp3");
var sound_win = new Audio("sounds/win.mp3");
var sound_changeMode = new Audio("sounds/changeMode.wav")
var sound_setFlag = new Audio("sounds/setFlag.wav");

// ------------------- СЕКУНДОМЕР -------------------
let timer_on = false;
let seconds = 0;
let interval;
timer_on = false;


function updateTime() {
  seconds++;
}
// --------------------------------------------------


function setMines() {
    // minesLocation.push("2-2");
    // minesLocation.push("2-3");
    // minesLocation.push("5-6");
    // minesLocation.push("3-4");
    // minesLocation.push("1-1");

    let minesLeft = minesCount;
    while (minesLeft > 0) { 
        let r = Math.floor(Math.random() * rows);
        let c = Math.floor(Math.random() * columns);
        let id = r.toString() + "-" + c.toString();

        if (!minesLocation.includes(id)) {
            minesLocation.push(id);
            minesLeft -= 1;
        }
    }
}


function startGame() {
    flag.addEventListener("click", setFlag);
    setMines();

    //populate our board
    for (let r = 0; r < rows; r++) {
        let row = [];
        let visual_row = document.createElement("div");
        visual_row.classList.add("row");
        for (let c = 0; c < columns; c++) {
            //<div id="0-0"></div>
            let tile = document.createElement("div");
            tile.id = r.toString() + "-" + c.toString();
            tile.addEventListener("click", clickTile);
            document.getElementById("board").append(tile);
            row.push(tile);  // передача клетки в технический ряд
            visual_row.append(tile);
            
        }
        document.getElementById("board").append(visual_row);  // закидываем ряд в доску
        board.push(row);  // передача технического ряда в техническую доску
    }
}

function setFlag() {
    // Проигрываем звук смены режима
    sound_changeMode.currentTime = 0;
    sound_changeMode.play();

    if (flagEnabled) {
        flagEnabled = false;flag.classList.remove("pressed");
    }
    else {
        flagEnabled = true;flag.classList.add("pressed");
    }
}

function clickTile() {
    if (gameOver || this.classList.contains("tile-clicked")) {
        return;
    }

    
    if (!flagEnabled && this.innerText == "🚩") {  // если в режиме открытия и жмешь туда где есть флаг
        return
    }

    let tile = this;
    if (flagEnabled) {
        // Проигрываем звук установки/снятия флага
        sound_setFlag.currentTime = 0;
        sound_setFlag.play();

        if (tile.innerText == "") {
            tile.innerText = "🚩";
        }
        else if (tile.innerText == "🚩") {
            tile.innerText = "";
        }
        return;
    }

    if (minesLocation.includes(tile.id)) {
        gameOver = true;
        sound_wrong.play();
        revealMines();
        flag.classList.add("pressed");  // делаем кнопку красивой
        flag.style.width = "250px";  // расширяем кнопку
        flag.style.padding = "0";  // это то что я подравнивал чтобы визуально отцентровать
        flag.innerHTML = "Поражение";
        flag.removeEventListener("click", setFlag);  // убираем установку/уборку флага по нажатию
        Telegram.WebApp.HapticFeedback.notificationOccurred('error');  // вибрация
        clearInterval(interval);  // останавливаем таймер

        // TODO: sendData
        if (tilesClicked > 9) {  // если нажато 10+ клеток
            var data = {
                isWin: false,  // победа?
                secondsSpent: seconds,  // сколько секунд затрачено
                doSpentEnegy: true  // надо тратить энергию?
            }
        }
        else {  // если потратил <= 9
            var data = {
                isWin: false,  // победа?
                secondsSpent: seconds,  // сколько секунд затрачено
                doSpentEnegy: false  // надо тратить энергию?
            }
        }
        flag.addEventListener("click", () => {
            Telegram.WebApp.sendData(JSON.stringify(data));
        });
        return;
    }


    let coords = tile.id.split("-"); // "0-0" -> ["0", "0"]
    let r = parseInt(coords[0]);
    let c = parseInt(coords[1]);
    checkMine(r, c);
    // Выше мы проверили, что да, плитка открываема и мы её открываем
    if (!timer_on) {
        timer_on = true;
        interval = setInterval(updateTime, 1000);
    };
    sound_empty.currentTime = 0;  // чтобы проигрывалось каждый раз, не дожидаясь окончания другого звука
    sound_empty.play();
}

function revealMines() {
    for (let r= 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            let tile = board[r][c];
            if (minesLocation.includes(tile.id)) {
                tile.innerText = "💣";
                tile.style.backgroundColor = "red";                
            }
        }
    }
}

function checkMine(r, c) {
    if (r < 0 || r >= rows || c < 0 || c >= columns) {
        return;
    }
    if (board[r][c].classList.contains("tile-clicked")) {
        return;
    }

    board[r][c].classList.add("tile-clicked");
    tilesClicked += 1;

    let minesFound = 0;

    //top 3
    minesFound += checkTile(r-1, c-1);      //top left
    minesFound += checkTile(r-1, c);        //top 
    minesFound += checkTile(r-1, c+1);      //top right

    //left and right
    minesFound += checkTile(r, c-1);        //left
    minesFound += checkTile(r, c+1);        //right

    //bottom 3
    minesFound += checkTile(r+1, c-1);      //bottom left
    minesFound += checkTile(r+1, c);        //bottom 
    minesFound += checkTile(r+1, c+1);      //bottom right

    if (minesFound > 0) {
        board[r][c].innerText = minesFound;
        board[r][c].classList.add("x" + minesFound.toString());
    }
    else {
        //top 3
        checkMine(r-1, c-1);    //top left
        checkMine(r-1, c);      //top
        checkMine(r-1, c+1);    //top right

        //left and right
        checkMine(r, c-1);      //left
        checkMine(r, c+1);      //right

        //bottom 3
        checkMine(r+1, c-1);    //bottom left
        checkMine(r+1, c);      //bottom
        checkMine(r+1, c+1);    //bottom right
    }

    if (tilesClicked == rows * columns - minesCount) {
        // document.getElementById("mines-count").innerText = "Cleared";
        gameOver = true;
        sound_win.play();
        flag.classList.add("pressed");
        flag.style.width = "200px";
        flag.style.padding = "0";  // это то что я подравнивал чтобы визуально отцентровать
        flag.innerHTML = "Победа";
        flag.removeEventListener("click", setFlag);
        clearInterval(interval);  // останавливаем таймер

        // TODO: sendData
        const data = {
            isWin: true,  // победа?
            secondsSpent:seconds,  // сколько секунд затрачено
            doSpentEnegy:true  // надо тратить энергию?
        }
        flag.addEventListener("click", () => {
            Telegram.WebApp.sendData(JSON.stringify(data));
        });
    }

}


function checkTile(r, c) {
    if (r < 0 || r >= rows || c < 0 || c >= columns) {
        return 0;
    }
    if (minesLocation.includes(r.toString() + "-" + c.toString())) {
        return 1;
    }
    return 0;
}

Telegram.WebApp.expand();
