var gameOptions = {},
	MyGame = {};

MyGame.game = new Kiwi.Game( null, "game", null, gameOptions );
MyGame.state = state;

MyGame.game.states.addState( state, true );
