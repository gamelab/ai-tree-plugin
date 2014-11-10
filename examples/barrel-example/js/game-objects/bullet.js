var Bullet = function( state, x, y, velocity ) {
	Kiwi.GameObjects.Sprite.call( this, state, state.textures.bullet, x, y );

	this.scaleX = velocity;
	this.physics = this.components.add(
		new Kiwi.Components.ArcadePhysics( this, this.box ) );
	this.physics.velocity.x = velocity * 50;

	this.animation.add( "move", [ 0 ], 0.1, false );
	this.animation.add( "explode", [ 1, 2, 3, 4 ], 0.1, false );
	this.animation.play( "move" );
};
Kiwi.extend( Bullet, Kiwi.GameObjects.Sprite );

Bullet.prototype.update = function() {
	Kiwi.GameObjects.Sprite.prototype.update.call( this );

	this.physics.update();

	if ( this.animation.currentAnimation.name !== "move" ) {
		this.physics.velocity.x = 0;
	}
	if ( this.x < -110 || this.x > 900 ) {
		this.destroy();
	} else if ( this.animation.currentAnimation.currentCell === 4 ) {
		this.destroy();
	}
};
