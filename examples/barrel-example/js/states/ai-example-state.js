// The main game state.

var state = new Kiwi.State( "state" );

state.create = function() {
	this.platform1 = new Platform( this, this.textures.platform1, 79, 243 );
	this.platform2 = new Platform( this, this.textures.platform2, 0, 418 );

	this.background = new Kiwi.GameObjects.StaticImage(
		this, this.textures.background, 0, 0 );

	this.barrelGroup = new Kiwi.Group( this );
	this.bulletGroup = new Kiwi.Group( this );

	this.soldier1 = new Soldier( this, 100, 332, [ [ 600, 332], [ 0, 332 ] ] );
	this.soldier2 = new Soldier( this, 100, 156, [ [ 250, 156], [ 30, 156 ] ] );

	this.text = new Kiwi.GameObjects.Textfield( this,
		"Click to drop a barrel.",
		this.game.stage.width / 2, 10, "#000", 12 );

	this.addChild( this.platform1 );
	this.addChild( this.platform2 );
	this.addChild( this.background );
	this.addChild( this.soldier1 );
	this.addChild( this.soldier2 );
	this.addChild( this.barrelGroup );
	this.addChild( this.bulletGroup );
	this.addChild( this.text );

	this.mouse = this.game.input.mouse;


	Kiwi.State.prototype.create.call( this );


	this.text.textAlign = Kiwi.GameObjects.Textfield.TEXT_ALIGN_CENTER;
	this.mouse.start();
};

state.checkCollisions = function() {
	var i, j, bullet, barrel;
	for ( i = 0 ; i < this.bulletGroup.members.length; i++ ) {
		for ( j = 0; j < this.barrelGroup.members.length; j++ ) {
			bullet = this.bulletGroup.members[ i ];
			barrel = this.barrelGroup.members[ j ];
			if ( bullet.animation.currentAnimation.name === "move" ) {
				if ( bullet.physics.overlaps( barrel ) ) {
					this.bulletGroup.members[ i ].animation.switchTo(
						"explode" ,true );
					barrel.health--;
				}
			}
		}
	}
};

state.createExplosion = function( barrel ) {
	this.addChild( new Explosion( this, barrel.x, barrel.y ) );
};

state.shoot = function( sprite ) {
	if ( sprite.scaleX === 1 ) {
		this.bulletGroup.addChild(
			new Bullet( this, sprite.x + 80, sprite.y + 49, 1 ) );
	} else if ( sprite.scaleX === -1 ) {
		this.bulletGroup.addChild(
			new Bullet( this, sprite.x + 20, sprite.y + 49, -1 ) );
	}
};

state.update = function() {
	Kiwi.State.prototype.update.call(this);

	this.soldier1.ai.update();
	this.soldier2.ai.update();
	this.checkCollisions();

	if ( this.mouse.isDown ) {
		this.barrelGroup.addChild(
			new Barrel( this, this.mouse.x - 18, this.mouse.y - 24 ) );
		this.mouse.reset();
	}
};
