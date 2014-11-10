var Barrel = function( state, x, y ) {
	Kiwi.GameObjects.StaticImage.call(
		this, state, state.textures.barrel, x, y );

	this.health = 3;
	this.physics = this.components.add(
		new Kiwi.Components.ArcadePhysics( this, this.box ) );
	this.physics.acceleration = new Kiwi.Geom.Point( 0, 15 );
	this.physics.velocity = new Kiwi.Geom.Point( 0, 9 );
};
Kiwi.extend( Barrel, Kiwi.GameObjects.StaticImage );

Barrel.prototype.update = function() {
	Kiwi.GameObjects.StaticImage.prototype.update.call( this );
	this.physics.update();

	if ( this.physics.overlaps( this.state.platform1 ) ||
			this.physics.overlaps( this.state.platform2 ) ) {
		this.physics.acceleration.y = 0;
		this.physics.velocity.y = 0;
	}
	if ( this.health <= 0 ) {
		this.state.createExplosion( this );
		this.destroy();
	}
};
