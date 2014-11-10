var gameOptions = {},
	MyBarrelGame = {};

MyBarrelGame.game = new Kiwi.Game( null, "barrelGame", null, gameOptions );
MyBarrelGame.state = state;

MyBarrelGame.game.states.addState( state );
MyBarrelGame.game.states.addState( loadingState );
MyBarrelGame.game.states.addState( preloader, true );
