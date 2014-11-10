// The main game state.
var state = new Kiwi.State( "state" );

state.create = function() {
	var i;

	this.resourceGroup = new Kiwi.Group( this );
	this.flierGroup = new Kiwi.Group( this );
	this.text = new Kiwi.GameObjects.Textfield( this,
		"Move the mouse to shift the feeding point.",
		this.game.stage.width / 2, 10, "#fff", 12 );

	this.text.textAlign = Kiwi.GameObjects.Textfield.TEXT_ALIGN_CENTER;

	// Distribute resources
	this.resourceGroup.addChild( this.createResource( 0, 0 ) );

	// Generate fliers
	for ( i = 0; i < 256; i++ ) {
		this.flierGroup.addChild(
			new Flier( this,
				Math.random() * this.game.stage.width,
				Math.random() * this.game.stage.height
				) );
	}

	// Construct scene graph
	this.addChild( this.resourceGroup );
	this.addChild( this.flierGroup );
	this.addChild( this.text );

	this.game.stage.rgbColor = {
		r: 0,
		g: 16,
		b: 32
	};
};


state.update = function() {
	Kiwi.State.prototype.update.call(this);

	// Cause a resource node to follow the pointer
	this.resourceGroup.members[ 0 ].x = this.game.input.position.x;
	this.resourceGroup.members[ 0 ].y = this.game.input.position.y;
};

// Geometry for a resource node.
state.createResource = function( x, y ) {
	var params, resource;

	params = {
		state: this,
		x: x,
		y: y,
		radius: 32,
		color: [ 0, 0.4, 0.8 ],
		strokeColor: [ 0, 0.2, 0.4 ],
		strokeWidth: 4,
		centerOnTransform: true
	};

	resource = new Kiwi.Plugins.Primitives.Ellipse( params );

	return resource;
};
