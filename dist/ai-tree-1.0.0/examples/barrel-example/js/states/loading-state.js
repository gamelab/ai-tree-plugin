var loadingState = new Kiwi.State( "loadingState" );
var preloader = new Kiwi.State( "preloader" );

preloader.preload = function() {
	Kiwi.State.prototype.preload.call( this );

	this.addImage( "loadingImage", "assets/loadingImage.png", true );
};

preloader.create = function() {
	Kiwi.State.prototype.create.call( this );

	this.game.states.switchState( "loadingState" );
};

loadingState.preload = function() {
	Kiwi.State.prototype.preload.call( this );

	this.game.stage.color = "#E0EDF1";
	this.logo = new Kiwi.GameObjects.StaticImage( this,
		this.textures.loadingImage, 150, 50 );

	this.addChild(this.logo);

	// ASSETS TO LOAD
	this.addImage( "background", "assets/background.png" );
	this.addImage( "barrel", "assets/barrel.png" );
	this.addImage( "platform1", "assets/platform1.png" );
	this.addImage( "platform2", "assets/platform2.png" );
	this.addSpriteSheet( "explosion", "assets/explosion.png", 129, 133) ;
	this.addSpriteSheet( "soldier", "assets/soldier.png", 150, 88 );
	this.addSpriteSheet( "bullet", "assets/bullet.png", 32, 32 );
};

loadingState.create = function() {
	Kiwi.State.prototype.create.call( this );

	this.switchToMain();
};

loadingState.switchToMain = function() {
	this.game.states.switchState( "state" );
};
