var Room = require('colyseus').Room
  , ClockTimer = require('clock-timer.js')

const TICK_RATE = 30
    , PATCH_RATE = 20

    , TURN_TIMEOUT = 10

class TicTacToe extends Room {

  constructor (options) {
    // call 'update' method each 50ms
    super(options, 1000 / PATCH_RATE)

    this.setState({
      currentTurn: null,
      players: {},
      board: [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
      winner: null,
      draw: null
    })

    this.clock = new ClockTimer(true)
  }

  requestJoin(options) {
    // only 2 players are allowed to play
    return this.clients.length < 2;
  }

  onJoin (client) {
    client.playerIndex = Object.keys(this.state.players).length
    this.state.players[ client.id ] = client.playerIndex

    if (this.clients.length == 2) {
      this.state.currentTurn = client.id
      this.nextTurnDelayed = this.clock.setTimeout(this.doRandomMove.bind(this), TURN_TIMEOUT * 1000)
    }
  }

  onMessage (client, data) {
    if (this.state.winner || this.state.draw) { return false; }

    if (client.id === this.state.currentTurn) {
      if (this.state.board[ data.x ][ data.y ] === 0) {
        let move = (client.playerIndex === 0) ? 'x' : 'o'
        this.state.board[ data.x ][ data.y ] = move

        if (this.checkWin(data.x, data.y, move)) {
          this.state.winner = client.id

        } else if (this.checkBoardComplete()) {
          this.state.draw = true

        } else {
          let playerIds = Object.keys(this.state.players)
            , nextPlayerIndex = (playerIds.indexOf(client.id) === 0) ? 1 : 0

          this.state.currentTurn = playerIds[nextPlayerIndex]
        }

      }
    }
  }

  checkBoardComplete () {
    console.log("isBoardComplete:", this._flatten(this.state.board).
      filter(item => item === 0).length === 0)
    return this._flatten(this.state.board).
      filter(item => item === 0).length === 0
  }

  doRandomMove () {
    // horizontal
    for (let x=0; x<this.state.board.length; x++) {
      for (let y=0; y<this.state.board[x]; y++) {
        if (this.state.board[x][y]===0) {
          let playerIndex = this.state.players[ this.state.currentTurn ]
          this.state.board[x][y] = (playerIndex === 0) ? 'x' : 'o'
        }
      }
    }
  }

  checkWin (x, y, move) {
    let won = false
      , board = this.state.board
      , boardSize = this.state.board.length

    // horizontal
    for(let i = 0; i < boardSize; i++){
      if (board[x][i] !== move) { break; }
      if (i == boardSize-1) {
        won = true
      }
    }

    // vertical
    for(let i = 0; i < boardSize; i++){
      if (board[i][y] !== move) { break; }
      if (i == boardSize-1) {
        won = true
      }
    }

    // cross forward
    if(x === y) {
      for(let i = 0; i < boardSize; i++){
        if(board[i][i] !== move) { break; }
        if(i == boardSize-1) {
          won = true
        }
      }
    }

    // cross backward
    for(let i = 0; i<boardSize; i++){
      if(board[i][(boardSize-1)-i] !== move) { break; }
      if(i == boardSize-1){
        won = true
      }
    }

    return won;
  }

  onLeave (client) {
  }

  _flatten(arr, previous) {
    let flattened = previous || []

    for (let i=0; i<arr.length; i++) {
      if (arr[i] instanceof Array) {
        this._flatten(arr[i], flattened)

      } else {
        flattened.push(arr[i])
      }
    }

    return flattened
  }

}

module.exports = TicTacToe
