var Platform = function ( state, texture, x, y ) {
	Kiwi.GameObjects.StaticImage.call( this, state, texture, x, y, true );
	this.physics = this.components.add(
		new Kiwi.Components.ArcadePhysics( this, this.box ) );
	this.physics.immovable = true;
};
Kiwi.extend( Platform, Kiwi.GameObjects.StaticImage );

Platform.prototype.update = function() {
	Kiwi.GameObjects.StaticImage.prototype.update.call( this );
	this.physics.update();
};
