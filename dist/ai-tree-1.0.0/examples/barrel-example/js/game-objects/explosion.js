var Explosion = function( state, x, y ) {
	Kiwi.GameObjects.Sprite.call(
		this, state, state.textures.explosion, x - 48, y - 68 );

	this.animation.add( "explode", [0, 1, 2, 3, 4 ], 0.1, false );
	this.animation.play( "explode" );
};
Kiwi.extend(Explosion, Kiwi.GameObjects.Sprite);

Explosion.prototype.update = function() {
	Kiwi.GameObjects.Sprite.prototype.update.call( this );

	if ( this.animation.currentAnimation.currentCell === 4 ) {
		this.destroy();
	}
};
